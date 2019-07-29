#!/bin/bash

docker-compose -f docker-compose-cli-peer.yaml -f docker-compose-raftosn.yaml down --volumes --remove-orphans

rm -rf channel-artifacts/*.block channel-artifacts/*.tx crypto-config ./org3-artifacts/crypto-config/ channel-artifacts/*.json