!macro customInit
  ; remove old printer:
  ExecWait "rundll32 printui.dll,PrintUIEntry /dl /q /n 梦想加打印机"
  ExecWait "$PROGRAMFILES\iSecStar\MengXiangJia\Uninstall.exe /S"
  ExecWait "$PROGRAMFILES32\iSecStar\MengXiangJia\Uninstall.exe /S"
  Sleep 3000
!macroend
!macro customInstall
  ExecWait "$INSTDIR\resources\extraResources\win\common\hpdriver.exe /S"
!macroend
!macro customUnInstall
  ExecWait "$PROGRAMFILES\iSecStar\MengXiangJia\Uninstall.exe /S"
  ExecWait "$PROGRAMFILES32\iSecStar\MengXiangJia\Uninstall.exe /S"
!macroend
