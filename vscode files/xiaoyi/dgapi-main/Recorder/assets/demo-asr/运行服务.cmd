@echo off

node -v > nul
if errorlevel 1 (
	echo δ��װNodeJs��node��صķ����޷����У���
	echo.
)

echo �����÷���
echo 1. node NodeJsServer_asr.aliyun.short.js ������һ�仰ʶ������Token��api�ӿ�

echo.
:inputIdx
set /p idx=������Ҫ���еķ������:

if "%idx%"=="1" (
	node NodeJsServer_asr.aliyun.short.js
) else (
	echo ���%idx%�����ڣ�
	goto inputIdx
)

echo bye~
pause