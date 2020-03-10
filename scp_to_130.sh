set -e
set -o pipefail

if [ "${1}" = "prod" ]; then
    BUILD_FOLDER_NAME="release"
    REMOTE_FOLDER_NAME="mtool-build-prod"
elif [ "${1}" = "qa" ]; then
    BUILD_FOLDER_NAME="qa-release"
    REMOTE_FOLDER_NAME="mtool-build-qa"
else
    echo "***ERROR: Please specify qa or prod"
    exit 1
fi

cd $BUILD_FOLDER_NAME
zip -r nsis-web.zip ./nsis-web/
cd ..

DTSTR=`date '+%Y-%m-%d-%H-%M-%S'`
echo "target dir: ${DTSTR}"

ssh mxj@10.28.3.130 "mkdir -p /work/misc/${REMOTE_FOLDER_NAME}/${DTSTR}"
scp $BUILD_FOLDER_NAME/*.dmg mxj@10.28.3.130:/work/misc/${REMOTE_FOLDER_NAME}/${DTSTR}/
scp $BUILD_FOLDER_NAME/nsis-web.zip mxj@10.28.3.130:/work/misc/${REMOTE_FOLDER_NAME}/${DTSTR}/

rm -f $BUILD_FOLDER_NAME/nsis-web.zip
