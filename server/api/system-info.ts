// server/api/system-info.get.ts
import { readFileSync } from 'fs'
import os from 'os'
import { join } from 'path'

// 缓存，避免重复计算
let cachedInfo: any = null
let cacheTime = 0
const CACHE_DURATION = 5000 // 5秒缓存

export default defineEventHandler(async (event) => {
  // 检查缓存
  const now = Date.now()
  if (cachedInfo && now - cacheTime < CACHE_DURATION) {
    return {
      code: 200,
      data: cachedInfo,
      message: '服务器信息获取成功（缓存）',
      timestamp: new Date().toISOString(),
      cached: true,
    }
  }

  try {
    // 使用同步方法，避免异步开销
    const data = await getSystemInfoSync()

    // 更新缓存
    cachedInfo = data
    cacheTime = now

    return {
      code: 200,
      data,
      message: '服务器信息获取成功',
      timestamp: new Date().toISOString(),
      cached: false,
    }
  } catch (error) {
    console.error('获取系统信息失败:', error)
    return {
      code: 500,
      data: null,
      message: '获取系统信息失败',
      timestamp: new Date().toISOString(),
    }
  }
})

// 同步获取所有信息（最快）
async function getSystemInfoSync() {
  // 1. 基本信息（同步）
  const platform = os.platform()
  const release = os.release()
  const arch = os.arch()
  const hostname = os.hostname()

  // 2. CPU 信息
  const cpus = os.cpus()
  const cpuModel = cpus[0]?.model || 'Unknown'
  const cpuCores = cpus.length

  // 使用新的 CPU 型号提取函数
  const cleanCpuModel = getCpuModelShort(cpuModel)

  // 3. 内存信息
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem

  // 4. 运行时间
  const uptime = os.uptime()
  const uptimeFormatted = formatUptimeSimple(uptime)

  // 5. Nuxt 版本
  const nuxtVersion = getNuxtVersionSync()

  // 6. 磁盘信息（获取所有磁盘的总和）
  const diskInfo = await getAllDiskInfo()

  return {
    os: `${getOsNameSimple(platform)} ${release} ${arch}`,
    cpu: `${cpuCores} 核 ${cleanCpuModel}`,
    memory: `${formatBytesFast(usedMem)} / ${formatBytesFast(totalMem)}`,
    disk: diskInfo,
    uptime: uptimeFormatted,
    nodeVersion: process.version,
    nuxtVersion: nuxtVersion,
    hostname: hostname,
  }
}

// CPU 型号提取改进版本
function getCpuModelShort(cpuModel: string): string {
  // 清理常见的商标符号和多余空格
  let cleanModel = cpuModel
    .replace(/\(R\)/gi, '') // 移除 (R)
    .replace(/\(TM\)/gi, '') // 移除 (TM)
    .replace(/®/g, '') // 移除 ®
    .replace(/™/g, '') // 移除 ™
    .replace(/CPU/g, '') // 移除 CPU 字样
    .replace(/@/g, '') // 移除 @
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim()

  // 尝试提取品牌和主要型号
  let extractedModel = ''

  if (cleanModel.includes('Intel')) {
    // Intel 处理器
    const match = cleanModel.match(
      /Intel\s+(Core|Xeon|Celeron|Pentium|Atom|Itanium)?\s*(i[3579]-\d+\w*|[A-Za-z]+\s*\d+\w*)?/i
    )
    console.log('Intel匹配结果:', match)

    if (match) {
      extractedModel = match[0]
    } else {
      // 如果正则匹配失败，取 Intel 后面的内容
      const parts = cleanModel.split(' ')
      const intelIndex = parts.findIndex((p) => p.toLowerCase().includes('intel'))
      if (intelIndex !== -1) {
        extractedModel = parts.slice(intelIndex, intelIndex + 4).join(' ')
      } else {
        extractedModel = cleanModel
      }
    }
  } else if (cleanModel.includes('AMD')) {
    // AMD 处理器
    const match = cleanModel.match(
      /AMD\s+(Ryzen|Athlon|EPYC|Threadripper|FX|A[0-9]+\s*Series)?\s*(\d+\w*)?/i
    )
    console.log('AMD匹配结果:', match)

    if (match) {
      extractedModel = match[0]
    } else {
      // 如果正则匹配失败，取 AMD 后面的内容
      const parts = cleanModel.split(' ')
      const amdIndex = parts.findIndex((p) => p.toLowerCase().includes('amd'))
      if (amdIndex !== -1) {
        extractedModel = parts.slice(amdIndex, amdIndex + 4).join(' ')
      } else {
        extractedModel = cleanModel
      }
    }
  } else if (cleanModel.includes('Apple')) {
    // Apple Silicon
    const match = cleanModel.match(/Apple\s+(M[1-9]\s*(Max|Pro|Ultra)?)/i)
    console.log('Apple匹配结果:', match)

    if (match) {
      extractedModel = match[0]
    } else {
      extractedModel = cleanModel
    }
  } else {
    // 其他处理器
    extractedModel = cleanModel
  }

  // 如果提取的型号太长，适当截断
  if (extractedModel.length > 40) {
    extractedModel = extractedModel.substring(0, 37) + '...'
  }

  console.log('最终提取:', extractedModel)
  return extractedModel || cleanModel || cpuModel
}

// 获取操作系统简名
function getOsNameSimple(platform: string): string {
  const map: Record<string, string> = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux',
    aix: 'AIX',
    freebsd: 'FreeBSD',
    openbsd: 'OpenBSD',
    sunos: 'SunOS',
  }
  return map[platform] || platform
}

// 获取 Nuxt 版本（同步）
function getNuxtVersionSync(): string {
  try {
    const packageJsonPath = join(process.cwd(), 'package.json')
    const content = readFileSync(packageJsonPath, 'utf-8')

    // 快速查找，避免完整解析
    const nuxtMatch = content.match(/"nuxt"\s*:\s*"([^"]+)"/)
    if (nuxtMatch) {
      return nuxtMatch[1].replace(/[\^~]/g, '')
    }

    // 尝试其他位置
    const devMatch = content.match(/"devDependencies"\s*:\s*{[\s\S]*?"nuxt"\s*:\s*"([^"]+)"/)
    if (devMatch) {
      return devMatch[1].replace(/[\^~]/g, '')
    }

    return '未知'
  } catch (error) {
    return '未知'
  }
}

// 获取所有磁盘信息（跨平台）
async function getAllDiskInfo(): Promise<string> {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    let totalBytes = 0
    let usedBytes = 0

    if (process.platform === 'win32') {
      // Windows: 获取所有本地磁盘（DriveType=3）
      try {
        // 方法1: 使用 PowerShell 获取所有磁盘
        const psCmd = `powershell -Command "$disks = Get-WmiObject Win32_LogicalDisk -Filter 'DriveType=3'; $total=0; $free=0; foreach ($d in $disks) { $total += $d.Size; $free += $d.FreeSpace }; Write-Host ('Total=' + $total + ',Free=' + $free)"`

        const { stdout: psStdout } = await execAsync(psCmd, { windowsHide: true })

        const totalMatch = psStdout.match(/Total=(\d+)/)
        const freeMatch = psStdout.match(/Free=(\d+)/)

        if (totalMatch && freeMatch) {
          totalBytes = parseInt(totalMatch[1])
          const freeBytes = parseInt(freeMatch[1])
          usedBytes = totalBytes - freeBytes
        } else {
          // 如果 PowerShell 失败，使用 wmic
          const wmicCmd = 'wmic logicaldisk where drivetype=3 get size,freespace'
          const { stdout: wmicStdout } = await execAsync(wmicCmd, { windowsHide: true })

          const lines = wmicStdout.trim().split('\n').slice(1) // 跳过标题行

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue

            const parts = trimmed.split(/\s+/)
            if (parts.length >= 2) {
              const size = parseInt(parts[0])
              const free = parseInt(parts[1])

              if (!isNaN(size) && !isNaN(free)) {
                totalBytes += size
                usedBytes += size - free
              }
            }
          }
        }
      } catch (winError) {
        console.warn('Windows磁盘信息获取失败:', winError.message)
      }
    } else {
      // Linux/Mac: 获取所有物理磁盘
      try {
        // 尝试使用 df 命令获取所有文件系统，排除特殊文件系统
        const cmd =
          "df -k 2>/dev/null | grep -E '^/dev/' | grep -vE 'tmpfs|devtmpfs|overlay|squashfs' || df -k 2>/dev/null | tail -n +2"
        const { stdout } = await execAsync(cmd)

        const lines = stdout.trim().split('\n')

        for (const line of lines) {
          if (!line.trim()) continue

          const parts = line.split(/\s+/)
          if (parts.length >= 4) {
            const total = parseInt(parts[1]) * 1024 // KB 转 bytes
            const used = parseInt(parts[2]) * 1024

            if (!isNaN(total) && !isNaN(used)) {
              totalBytes += total
              usedBytes += used
            }
          }
        }

        // 如果没有获取到数据，尝试获取根目录
        if (totalBytes === 0) {
          const rootCmd = 'df -k / | tail -1'
          const { stdout: rootStdout } = await execAsync(rootCmd)
          const parts = rootStdout.trim().split(/\s+/)

          if (parts.length >= 4) {
            totalBytes = parseInt(parts[1]) * 1024
            usedBytes = parseInt(parts[2]) * 1024
          }
        }
      } catch (unixError) {
        console.warn('Unix磁盘信息获取失败:', unixError.message)
      }
    }

    // 如果成功获取了数据
    if (totalBytes > 0) {
      return `${formatBytesFast(usedBytes)} / ${formatBytesFast(totalBytes)}`
    } else {
      // 如果获取失败，尝试只获取C盘/根目录
      return await getSingleDiskInfo()
    }
  } catch (error) {
    console.warn('获取磁盘信息失败:', error.message)
    // 最后的手段：返回默认值
    return '未知 / 未知'
  }
}

// 获取单个磁盘信息（备用方法）
async function getSingleDiskInfo(): Promise<string> {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    let cmd = ''
    if (process.platform === 'win32') {
      // Windows: 获取 C 盘信息
      cmd = 'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /value'
    } else {
      // Linux/Mac: 获取根目录信息
      cmd = 'df -k / | tail -1'
    }

    const { stdout } = await execAsync(cmd)

    if (process.platform === 'win32') {
      // 解析 Windows 输出
      const sizeMatch = stdout.match(/Size=(\d+)/)
      const freeMatch = stdout.match(/FreeSpace=(\d+)/)

      if (sizeMatch && freeMatch) {
        const total = parseInt(sizeMatch[1])
        const free = parseInt(freeMatch[1])
        const used = total - free

        return `${formatBytesFast(used)} / ${formatBytesFast(total)}`
      }
    } else {
      // 解析 Linux/Mac 输出
      const parts = stdout.trim().split(/\s+/)
      if (parts.length >= 4) {
        const total = parseInt(parts[1]) * 1024
        const used = parseInt(parts[2]) * 1024

        return `${formatBytesFast(used)} / ${formatBytesFast(total)}`
      }
    }
  } catch (error) {
    console.warn('获取单个磁盘信息失败:', error.message)
  }

  return '未知 / 未知'
}

// 快速格式化字节
function formatBytesFast(bytes: number): string {
  const gb = bytes / 1024 ** 3
  if (gb >= 100) return `${Math.round(gb)} GB`
  if (gb >= 10) return `${gb.toFixed(1)} GB`
  if (gb >= 1) return `${gb.toFixed(2)} GB`

  const mb = bytes / 1024 ** 2
  if (mb >= 100) return `${Math.round(mb)} MB`
  if (mb >= 10) return `${mb.toFixed(1)} MB`
  if (mb >= 1) return `${mb.toFixed(2)} MB`

  const kb = bytes / 1024
  return `${Math.round(kb)} KB`
}

// 快速格式化运行时间
function formatUptimeSimple(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  if (days > 0) return `${days}天`

  const hours = Math.floor(seconds / 3600)
  if (hours > 0) return `${hours}小时`

  const minutes = Math.floor(seconds / 60)
  return `${minutes}分钟`
}
