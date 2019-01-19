#!/bin/bash

# Copyright 2018 Ege Korkan

# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


# This script tests Thing Descriptions found in the sub directories

####################################################################################################################################
# TD Counter
####################################################################################################################################
tdValidFolder="./WebContent/Examples/Valid"
tdInvalidFolder="./WebContent/Examples/Invalid"
tdWarningFolder="./WebContent/Examples/Warning"

tdCount=0
for curTD in $( ls $tdValidFolder); do
tdCount=$((tdCount+1))
done
for curTD in $( ls $tdInvalidFolder); do
tdCount=$((tdCount+1))
done
for curTD in $( ls $tdWarningFolder); do
tdCount=$((tdCount+1))
done

####################################################################################################################################
# Validity Test. These test should not produce any warning or error
####################################################################################################################################

# Validity Test Counters
countValidTotal=0 # How many TDs found in the directory
countIsValid=0 # How many TDs of that directory are valid

for curTD in $( ls $tdValidFolder); do
    countValidTotal=$((countValidTotal+1))
    echo $countValidTotal "/" $tdCount "TD:" $curTD
    output=$(node Scripts/playground.js $tdValidFolder/$curTD)
    #echo "my output is" $output

    if [[ $output == *"KO"* ]]; then
        echo $curTD "was supposed to be valid but gave error"
        echo "OUTPUT: " $output
        
    elif [[ $output == *"Warning"* ]]; then
        echo $curTD "was supposed to be valid but gave warning"
        echo "OUTPUT: " $output

    elif [[ $output == *"JSON-LD validation... OK"* ]]; then
        #echo $curTD "passed the test"
        countIsValid=$((countIsValid+1))
    else
        echo $curTD "has some weird error"
        echo "OUTPUT: " $output
    fi
done


if [[ $countValidTotal == 0 ]]; then 
    echo "No valid TDs to check has been found"
else
    if [[ $countIsValid == $countValidTotal ]]; then
        echo "Validity test succesful. All TDs that are supposed to be valid are indeed valid"
    else 
        echo "Validity test NOT succesful, " $countIsValid "/" $countValidTotal "passed the validity test"
    fi
fi

####################################################################################################################################
# Invalidity Test. These test should produce at least one error. Warnings do not count
####################################################################################################################################

countInvalidTotal=0
countIsInvalid=0

for curTD in $( ls $tdInvalidFolder); do
    countInvalidTotal=$((countInvalidTotal+1))
    echo $((countValidTotal+countInvalidTotal)) "/" $tdCount "TD:" $curTD
    output=$(node Scripts/playground.js $tdInvalidFolder/$curTD)
    #echo "my output is" $output

    if [[ $output == *"KO"* ]]; then
        #echo $curTD "has passed the invalidity test"
        countIsInvalid=$((countIsInvalid+1))
    else
        echo $curTD "was supposed to be invalid but was not."
        echo "OUTPUT: " $output
    fi
done


if [[ $countInvalidTotal == 0 ]]; then 
    echo "No invalid TDs to check has been found"
else
    if [[ $countIsInvalid == $countInvalidTotal ]]; then
        echo "Invalidity test succesful. All TDs that are supposed to be invalid are indeed invalid"
    else 
        echo "Invalidity test NOT succesful, " $countIsInvalid "/" $countInvalidTotal "passed the invalidity test"
    fi
fi

####################################################################################################################################
# Warning Test. These test should produce at least one warning, errors do not count
####################################################################################################################################

countWarningTotal=0
countIsWarning=0


for curTD in $( ls $tdWarningFolder); do
    countWarningTotal=$((countWarningTotal+1))
    echo $((countWarningTotal+countValidTotal+countInvalidTotal)) "/" $tdCount "TD:" $curTD
    output=$(node Scripts/playground.js $tdWarningFolder/$curTD)
    #echo "my output is" $output

    if [[ $output == *"KO"* ]]; then
        echo $curTD "was supposed to give a warning but gave error"
        echo "OUTPUT: " $output
        
    elif [[ $output == *"Warning"* ]]; then
        #echo $curTD "has passed the warning test"
        countIsWarning=$((countIsWarning+1))

    elif [[ $output == *"JSON-LD validation... OK"* ]]; then
        echo $curTD "was supposed to give a warning but passed all the tests"
    else
        echo $curTD "has some weird error"
        echo "OUTPUT: " $output
    fi
done

if [[ $countWarningTotal == 0 ]]; then 
    echo "No warning TDs to check has been found"
else
    if [[ $countIsWarning == $countWarningTotal ]]; then
        echo "Warning test succesful. All TDs that are supposed to give warning gave warning"
    else 
        echo "Warning test NOT succesful, " $countIsWarning "/" $countWarningTotal "passed the warning test"
    fi
fi