#!/usr/bin/env bash
Blue='\033[0;34m'
NC='\033[0m'

CLIPATH="../cli/index.js"
INPATH="assertions-csv/manual-generation-inputs"
TMPPATH="assertions-csv/.tmp/"
OUTPATH="assertions-csv"

TDNAME="MinimalThing.json"
TMNAME="MinimalThingModel.json"

echo -e "* ${Blue}Initialization${NC}"
mkdir ${OUTPATH}/.tmp

echo -e "* ${Blue}Generating implemented TD Assertions${NC}"
node ${CLIPATH} -a -i $(pwd)/${INPATH}/${TDNAME} -o ${TMPPATH}

echo -e "* ${Blue}Generating implemented TM Assertions${NC}"
node ${CLIPATH} -a -t TM -i $(pwd)/${INPATH}/${TMNAME} -o ${TMPPATH}

echo -e "* ${Blue}Combining in one file${NC}"
sed -i 1d ${TMPPATH}${TMNAME/json/csv}

IMPLEMENTED_TD=$(cat ${TMPPATH}${TDNAME/json/csv})
IMPLEMENTED_TM=$(cat ${TMPPATH}${TMNAME/json/csv})

echo "${IMPLEMENTED_TD}" > ${INPATH}/"pre-implemented.csv"
echo "${IMPLEMENTED_TM}" >> ${INPATH}/"pre-implemented.csv"

echo -e "* ${Blue}Clean tmp${NC}"
rm -r ${OUTPATH}/.tmp

echo -e "* ${Blue}Calling node script for manual.csv generation${NC}"
node generate-manual-csv.js


