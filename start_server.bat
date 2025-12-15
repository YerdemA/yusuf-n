@echo off
echo Sunucu baslatiliyor...
echo Tarayiciniz acilacak. Lutfen pencereyi kapatmayin.
start "" "http://localhost:8000"
python -m http.server 8000
pause
