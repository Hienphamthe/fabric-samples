#!/bin/bash

docker-compose -f docker-compose-cli.yaml -f docker-compose-etcdraft2.yaml down --volumes --remove-orphans

rm -rf channel-artifacts/*.block channel-artifacts/*.tx crypto-config ./org3-artifacts/crypto-config/ channel-artifacts/*.json