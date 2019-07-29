#!/bin/bash

export FABRIC_CFG_PATH=${PWD}

../bin/cryptogen generate --config=./crypto-config.yaml
../bin/configtxgen -profile ThreeOrgsOrdererGenesisRAFT -channelID logichain-sys-channel -outputBlock ./channel-artifacts/genesis.block

export CHANNEL_NAME=mychannel
../bin/configtxgen -profile ThreeOrgsChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID $CHANNEL_NAME

../bin/configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
../bin/configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org2MSP
../bin/configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org3MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org3MSP

docker-compose -f docker-compose-cli-peer.yaml -f docker-compose-raftosn.yaml up -d