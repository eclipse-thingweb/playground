node packages/cli/index.js -t TD -a -i packages/core/examples/tds/valid/ -o assertion1
node packages/cli/index.js -t TD -a -i packages/core/examples/tds/notValidYet/ -o assertion2
node packages/cli/index.js --merge-only assertion1.csv assertion2.csv -o packages/assertions/assertionCoverage
rm assertion1.csv
rm assertion2.csv