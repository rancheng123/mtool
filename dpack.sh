# /bin/sh

if [ -d "qa-release" ]; then
	mkdir qa-mtool-$1
	cp ./qa-release/nsis-web/* ./qa-mtool-$1
	cp ./qa-release/qa-mTool-*.dmg ./qa-mtool-$1
	zip -q -r qa-mtool-$1'.zip' ./qa-mtool-$1
	rm -rf qa-mtool-$1 qa-release
else
	mkdir mtool-$1
	cp ./release/nsis-web/* ./mtool-$1
	cp ./release/mTool-*.dmg ./mtool-$1
	zip -q -r mtool-$1'.zip' ./mtool-$1
	rm -rf mtool-$1 release
fi
echo 'Done'