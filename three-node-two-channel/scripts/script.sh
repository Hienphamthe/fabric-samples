#!/bin/bash

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo
echo "Build your first network (BYFN) end-to-end test"
echo
CHANNEL_NAME_1="$1"
CHANNEL_NAME_2="$2"
DELAY="$3"
LANGUAGE="$4"
TIMEOUT="$5"
VERBOSE="$6"
: ${CHANNEL_NAME_1:="channelall"}
: ${CHANNEL_NAME_2:="channel12"}
: ${DELAY:="3"}
: ${LANGUAGE:="golang"}
: ${TIMEOUT:="10"}
: ${VERBOSE:="false"}
LANGUAGE=`echo "$LANGUAGE" | tr [:upper:] [:lower:]`
COUNTER=1
MAX_RETRY=10

CC_SRC_PATH="github.com/chaincode/chaincode_example02/go/"
if [ "$LANGUAGE" = "node" ]; then
	CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/chaincode_example02/node/"
fi

if [ "$LANGUAGE" = "java" ]; then
	CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/chaincode_example02/java/"
fi

echo "Channel name : "$CHANNEL_NAME_1" and " $CHANNEL_NAME_2

# import utils
. scripts/utils.sh

createChannel() {
	setGlobals 0 1

	if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
                set -x
		peer channel create -o orderer.example.com:7050 -c $CHANNEL_NAME_1 -f ./channel-artifacts/channelall.tx >&log.txt
		res=$?
                set +x
	else
				set -x
		peer channel create -o orderer.example.com:7050 -c $CHANNEL_NAME_1 -f ./channel-artifacts/channelall.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
		res=$?
				set +x
	fi
	cat log.txt
	verifyResult $res "Channel creation failed"
	echo "===================== Channel '$CHANNEL_NAME_1' created ===================== "
	echo

	if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
                set -x
		peer channel create -o orderer.example.com:7050 -c $CHANNEL_NAME_2 -f ./channel-artifacts/channel12.tx >&log.txt
		res=$?
                set +x
	else
				set -x
		peer channel create -o orderer.example.com:7050 -c $CHANNEL_NAME_2 -f ./channel-artifacts/channel12.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
		res=$?
				set +x
	fi
	cat log.txt
	verifyResult $res "Channel creation failed"
	echo "===================== Channel '$CHANNEL_NAME_2' created ===================== "
	echo
}

joinChannel () {
	for org in 1 2 3; do
	    for peer in 0; do
		joinChannelWithRetry $peer $org $CHANNEL_NAME_1
		echo "===================== peer${peer}.org${org} joined channel '$CHANNEL_NAME_1' ===================== "
		sleep $DELAY
		echo
		joinChannelWithRetry $peer $org $CHANNEL_NAME_2
		echo "===================== peer${peer}.org${org} joined channel '$CHANNEL_NAME_2' ===================== "
		sleep $DELAY
		echo
	    done
	done
}

## Create channel
echo "Creating channel..."
createChannel

## Join all the peers to the channel
echo "Having all peers join the channel..."
joinChannel

## Set the anchor peers for each org in the channel
#echo "Updating anchor peers for org1..."
#updateAnchorPeers 0 1
#echo "Updating anchor peers for org2..."
#updateAnchorPeers 0 2


## Install chaincode on peer0.org1 and peer0.org2
echo "Installing chaincode on peer0.org1..."
installChaincode 0 1
echo "Installing chaincode on peer0.org2..."
installChaincode 0 2
echo "Installing chaincode on peer0.org3..."
installChaincode 0 3

####### on CHANNEL_NAME_1 ######
export CHANNEL_NAME=$CHANNEL_NAME_1
echo "####### on channel '$CHANNEL_NAME' ######"
# Instantiate chaincode on peer0.org1
echo "Instantiating chaincode on peer0.org1..."
instantiateChaincode 0 1

# Query chaincode on peer0.org2
echo "Querying chaincode on peer0.org2..."
chaincodeQuery 0 2 100

# Query chaincode on peer0.org3
echo "Querying chaincode on peer0.org3..."
chaincodeQuery 0 3 100

# Invoke chaincode on peer0.org1, org2, org3 ***NOTE: based on endorsement policy of this chaincode
echo "Sending invoke transaction on peer0.org1..."
chaincodeInvoke 0 1 0 2 0 3

# Query chaincode on peer0.org3
echo "Querying chaincode on peer0.org3..."
chaincodeQuery 0 3 90

####### on CHANNEL_NAME_2 ######
export CHANNEL_NAME=$CHANNEL_NAME_2
echo "####### on channel '$CHANNEL_NAME' ######"
## Use the same chaincode that is installed before on all peer node

# Instantiate chaincode on peer0.org1
echo "Instantiating chaincode on peer0.org1..."
instantiateChaincode 0 1

# Instantiate chaincode on peer0.org2
echo "Instantiating chaincode on peer0.org2..."
instantiateChaincode 0 2

# Query chaincode on peer0.org1
echo "Querying chaincode on peer0.org1..."
chaincodeQuery 0 1 10

# Invoke chaincode on peer0.org1 and peer0.org2
echo "Sending invoke transaction on peer0.org1 peer0.org2..."
chaincodeInvoke 0 1 0 2

# Query on chaincode on peer0.org2, check if the result is 9
echo "Querying chaincode on peer0.org2..."
chaincodeQuery 0 2 9

# Query on chaincode on peer0.org3, check if any error is returned
echo "Querying chaincode on peer0.org3..."
chaincodeQuery 0 3 "error"

echo
echo "========= All GOOD, BYFN execution completed =========== "
echo

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo

exit 0
