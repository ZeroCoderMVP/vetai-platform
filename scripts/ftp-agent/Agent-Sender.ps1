<#
.SYNOPSIS
    Агент для мониторинга папки и отправки новых или измененных файлов по FTP/HTTP.
    Отлично подходит для сбора отчетов (DTM, Afimilk) с фермы.
#>

# ================= НАСТРОЙКИ =================
$SourceFolder = "C:\DataToUpload" # Папка, которую будем отслеживать
$FtpServer = "ftp://192.168.1.100/Inbox" # Куда отправлять (папка на FTP сервере)
$FtpUsername = "ftpuser"
$FtpPassword = "ftppassword"
$CheckIntervalSeconds = 60 # Как часто проверять папку (в секундах)
# =============================================

$StateFile = "$PSScriptRoot\agent_state.json"
$LogFile = "$PSScriptRoot\agent.log"

Function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

Function Upload-FileToFtp {
    param(
        [string]$FilePath,
        [string]$FtpUrl,
        [string]$User,
        [string]$Pass
    )
    try {
        $WebClient = New-Object System.Net.WebClient
        if ($User -ne "") {
            $WebClient.Credentials = New-Object System.Net.NetworkCredential($User, $Pass)
        }
        $FileName = [System.IO.Path]::GetFileName($FilePath)
        # Обработка URL, чтобы избежать двойных слэшей
        if (-not $FtpUrl.EndsWith("/")) { $FtpUrl += "/" }
        $Uri = New-Object System.Uri($FtpUrl + $FileName)
        
        $WebClient.UploadFile($Uri, "STOR", $FilePath)
        return $true
    }
    catch {
        Write-Log "Ошибка отправки $($FilePath): $_"
        return $false
    }
}

Function Test-FileLock {
    param([string]$FilePath)
    $Locked = $false
    try {
        $Stream = [System.IO.File]::Open($FilePath, 'Open', 'Read', 'None')
        $Stream.Close()
        $Stream.Dispose()
    } catch {
        $Locked = $true
    }
    return $Locked
}

# Загрузка состояния (ранее отправленные файлы)
$SentFiles = @{}
if (Test-Path $StateFile) {
    try {
        $SentFiles = Get-Content $StateFile -Raw | ConvertFrom-Json -AsHashtable
    } catch {
        Write-Log "Ошибка чтения файла состояний, начинаем с чистого листа."
    }
    if ($null -eq $SentFiles) { $SentFiles = @{} }
}

Write-Log "Скрипт запущен. Мониторинг папки: $SourceFolder каждые $CheckIntervalSeconds секунд."

while ($true) {
    if (Test-Path $SourceFolder) {
        # Ищем все файлы (включая подкаталоги)
        $Files = Get-ChildItem -Path $SourceFolder -File -Recurse

        foreach ($File in $Files) {
            $FileKey = $File.FullName
            $LastWrite = $File.LastWriteTimeUtc.ToString("o")
            $FileLength = $File.Length

            # Проверяем, отправлялся ли файл или изменился ли он (по дате или размеру)
            $NeedsUpload = $false
            if (-not $SentFiles.ContainsKey($FileKey)) {
                $NeedsUpload = $true
            } else {
                $SavedState = $SentFiles[$FileKey]
                if ($SavedState.LastWrite -ne $LastWrite -or $SavedState.Length -ne $FileLength) {
                    $NeedsUpload = $true
                }
            }

            if ($NeedsUpload) {
                # Ждем, пока файл перестанет быть занят другой программой (например, если он еще скачивается)
                if (Test-FileLock -FilePath $File.FullName) {
                    Write-Log "Файл $($File.Name) занят другим процессом. Пропуск до следующего цикла..."
                    continue
                }

                Write-Log "Обнаружен новый или измененный файл: $($File.Name). Начинаем отправку..."
                
                $Success = Upload-FileToFtp -FilePath $File.FullName -FtpUrl $FtpServer -User $FtpUsername -Pass $FtpPassword
                
                if ($Success) {
                    Write-Log "УСПЕХ: Файл отправлен - $($File.Name)"
                    $SentFiles[$FileKey] = @{
                        LastWrite = $LastWrite
                        Length = $FileLength
                        UploadedAt = (Get-Date).ToString("o")
                    }
                    
                    # Сохраняем состояние после каждой успешной отправки
                    try {
                        $Json = $SentFiles | ConvertTo-Json -Depth 3
                        Set-Content -Path $StateFile -Value $Json
                    } catch {
                        Write-Log "Не удалось сохранить состояние в $StateFile"
                    }
                }
            }
        }
    } else {
        Write-Log "ОШИБКА: Целевая папка $SourceFolder не найдена!"
    }

    # Спим до следующей проверки
    Start-Sleep -Seconds $CheckIntervalSeconds
}
