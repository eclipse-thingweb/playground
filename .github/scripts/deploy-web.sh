TMP_PASS_FILE="$(mktemp)"
echo "$SSH_PASS" > $TMP_PASS_FILE
ssh -i $TMP_PASS_FILE -o StrictHostKeyChecking=no -o LogLevel=error $SSH_HOST "git clone https://github.com/thingweb/thingweb-playground.git; cd thingweb-playground; lerna bootstrap; cd ./packages/web; npm install; echo installed locally; rm -r -f /var/www/html/*; cp -r ./* /var/www/html; echo cleaned and copy to webdir; cd ../../../; rm -r -f thingweb-playground; echo CD DONE"
