ASDF_TEST="$(mktemp)"
echo "$PG_TEST" > $ASDF_TEST
ssh -i $ASDF_TEST -o StrictHostKeyChecking=no $MY_HOST "ls; ls -la"