@echo off
echo =======================================
echo Starting EduFlash Backend (Spring Boot)
echo =======================================

cd /d "%~dp0"
call .\maven-mvnd-1.0.6-windows-amd64\bin\mvnd spring-boot:run
pause
