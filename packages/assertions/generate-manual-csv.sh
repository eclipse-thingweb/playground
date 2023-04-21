#!/usr/bin/env bash
#
# Copyright (c) 2023 Contributors to the Eclipse Foundation
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Eclipse Public License v. 2.0 which is available at
# http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
# Document License (2015-05-13) which is available at
# https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
#
# SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
#

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

echo -e "* ${Blue}Get current manual.csv from TD Repo${NC}"
curl -s https://raw.githubusercontent.com/w3c/wot-thing-description/main/testing/manual.csv -o ${OUTPATH}/"oldManual.csv"

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

echo -e "* ${Blue}Generate change-log of manual.csv${NC}"
node generate-changelog.js ${OUTPATH}/"oldManual.csv" ${OUTPATH}/"manual.csv" ${OUTPATH}/"changelog.md"


