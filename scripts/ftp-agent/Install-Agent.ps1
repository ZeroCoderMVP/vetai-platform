<#
.SYNOPSIS
    Установка агента (скрипта Agent-Sender.ps1) в планировщик задач Windows для автозапуска.
#>

$TaskName = "VETAI_Data_Agent"
$ScriptPath = "$PSScriptRoot\Agent-Sender.ps1"

if (-not (Test-Path $ScriptPath)) {
    Write-Host "Ошибка: Скрипт $ScriptPath не найден!" -ForegroundColor Red
    Exit
}

# 1. Проверяем наличие задачи и удаляем старую
$TaskExists = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($TaskExists) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Старая версия задачи '$TaskName' успешно удалена." -ForegroundColor Yellow
}

# 2. Создаем действие: запуск PowerShell в скрытом режиме с передачей скрипта агента
# ExecutionPolicy Bypass позволяет запускать скрипт, даже если стоит запрет в системе
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""

# 3. Создаем триггер автозапуска при входе любого пользователя
# Это обеспечивает работу скрипта в фоне сразу после включения ПК и логина.
$Trigger = New-ScheduledTaskTrigger -AtLogOn

# 4. Настраиваем условия (не останавливать при переходе на батарею и т.д.)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Days 365)

# 5. Регистрация задачи
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Агент постоянного мониторинга локальных папок и отправки новых файлов по FTP (для платформы VETAI)"

Write-Host ""
Write-Host "================== УСТАНОВКА ЗАВЕРШЕНА ==================" -ForegroundColor Green
Write-Host "Задача '$TaskName' успешно добавлена в Планировщик задач."
Write-Host "Скрипт будет автоматически запускаться при старте Windows и входе пользователя."
Write-Host ""
Write-Host "Чтобы запустить агента ПРЯМО СЕЙЧАС, введите команду:" -ForegroundColor Cyan
Write-Host "Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "========================================================="
