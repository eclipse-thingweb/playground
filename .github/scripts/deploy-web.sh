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

TMP_PASS_FILE="$(mktemp)"
echo "$SSH_PASS" > $TMP_PASS_FILE
ssh -i $TMP_PASS_FILE -o StrictHostKeyChecking=no -o LogLevel=error $SSH_HOST "rm -r -f thingweb-playground; git clone https://github.com/thingweb/thingweb-playground.git; cd thingweb-playground; lerna bootstrap; cd ./packages/web; rm -r -f /var/www/html/playground/*; cp -L -r ./* /var/www/html/playground; echo cleaned and copy to webdir; echo CD DONE"
