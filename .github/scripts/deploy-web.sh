ASDF_TEST="$(mktemp)"
echo "$PG_TEST" > $ASDF_TEST
ssh -i $ASDF_TEST -o StrictHostKeyChecking=no $MY_HOST "git clone https://github.com/$GITHUB_REPOSITORY.git; cd thingweb-playground; lerna bootstrap; cp -r ./packages/playground-web/ /var/www/html/; cd ../; rm -r -f thingweb-playground; echo cd done"