@echo off
echo Stopping Next.js dev server...
taskkill /F /IM node.exe 2>nul

echo.
echo Waiting 2 seconds for processes to close...
timeout /t 2 /nobreak >nul

echo.
echo Generating Prisma Client...
npx prisma generate

echo.
echo Done! You can now restart your dev server with: npm run dev
echo.
pause
