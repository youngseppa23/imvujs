HERE=`dirname "$0"`

OS=`python -c "import sys; print sys.platform"`

if [ $OS == 'darwin' ]; then
    NODE=$HERE/../third-party/mac/node
elif [ $OS == 'linux2' ]; then
    NODE=nodejs
else
    NODE=$HERE/../third-party/windows/nodejs/node.exe
fi
