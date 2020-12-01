TMP_PASS_FILE="$(mktemp)"
echo "$SSH_PASS" > $TMP_PASS_FILE
ssh -i $TMP_PASS_FILE -o StrictHostKeyChecking=no $SSH_HOST "git clone https://github.com/$GITHUB_REPOSITORY.git; cd thingweb-playground; lerna bootstrap; cd ./packages/playground-web; npm install; rm -r -f /var/www/html/*; cp -r ./* /var/www/html; cd ../../../; rm -r -f thingweb-playground; echo CD DONE"
