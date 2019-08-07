#!/bin/bash

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo
echo "Logichain end-to-end test"
echo
CHANNEL_NAME="$1"
DELAY="$2"
LANGUAGE="$3"
TIMEOUT="$4"
VERBOSE="$5"
: ${CHANNEL_NAME:="mychannel"}
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

echo "Channel name : "$CHANNEL_NAME

# import utils
. scripts/utils.sh

createChannel() {
	setGlobals 0 1
	# send request to orderer of org1 for channel.block on behalf of peer0.org1
	if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
		set -x
		peer channel create -o orderer.org1.de:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx >&log.txt
		res=$?
		set +x
	else
		set -x
		peer channel create -o orderer.org1.de:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_ORG1_CA >&log.txt
		res=$?
		set +x
	fi
	cat log.txt
	verifyResult $res "Channel creation failed"
	echo "===================== Channel '$CHANNEL_NAME' created ===================== "
	echo
}

joinChannel () {
	for org in 1 2 3; do
	    for peer in 0 1; do
		joinChannelWithRetry $peer $org
		echo "===================== peer${peer}.org${org} joined channel '$CHANNEL_NAME' ===================== "
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
echo "Updating anchor peers for org1..."
updateAnchorPeers 0 1
echo "Updating anchor peers for org2..."
updateAnchorPeers 0 2
echo "Updating anchor peers for org2..."
updateAnchorPeers 0 3

## Stop here if you want to install other chaincode
#echo "Stop before install any chaincode. Requested by user."
#exit 0

# Working with device id chaincode
CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/device_id_cc/"
## Install chaincode on peer0.org1 and peer0.org2 and peer0.org3
echo "Installing chaincode on peer0.org1..."
installChaincode 0 1
echo "Installing chaincode on peer0.org2..."
installChaincode 0 2
echo "Installing chaincode on peer0.org3..."
installChaincode 0 3
# Instantiate chaincode on peer0.org2
echo "Instantiating chaincode on peer0.org2..."
ARG='{"function":"init","Args":[]}'
instantiateChaincode 0 2
sleep 5
# Invoke chaincode: change device key on peer0.org1
echo "Invoke chaincode: change device key on peer0.org1..."
ARG='{"function":"setDevice","Args":["1","newpublickey"]}'
setGlobals 0 1
chaincodeInvoke 0 1 0 2 0 3
sleep 10
# Invoke chaincode: add new device on peer0.org3
echo "Invoke chaincode: add new device on peer0.org3..."
ARG='{"function":"addNewDevice","Args":["6","newpublickey2"]}'
setGlobals 0 3
chaincodeInvoke 0 1 0 2 0 3

echo "Stop before after device_id_cc chaincode. Requested by user."
exit 0

# Working with approval chaincode
CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/approval_cc/"
## Install chaincode on peer0.org1 and peer0.org2 and peer0.org3
echo "Installing chaincode on peer0.org1..."
installChaincode 0 1
echo "Installing chaincode on peer0.org2..."
installChaincode 0 2
echo "Installing chaincode on peer0.org3..."
installChaincode 0 3
# Instantiate chaincode on peer0.org2
echo "Instantiating chaincode on peer0.org2..."
ARG='{"function":"init","Args":[]}' #'{"Args":["init","a","100","b","200"]}'
instantiateChaincode 0 2
sleep 5
# Invoke chaincode: add org approval on peer0.org1
ARG='{"function":"addOrgApproval","Args":["Org1"]}' #'{"Args":["invoke","a","b","10"]}'
setGlobals 0 1
chaincodeInvoke 0 1 0 2 0 3
sleep 10
# Invoke chaincode: add org approval on peer0.org3
ARG='{"function":"addOrgApproval","Args":["Org3"]}'
setGlobals 0 3
chaincodeInvoke 0 1 0 2 0 3

# Query chaincode on peer0.org1
echo "Querying chaincode on peer0.org1..."
chaincodeQuery 0 1 100

# Invoke chaincode on peer0.org1 and peer0.org2 peer0.org3
echo "Sending invoke transaction on peer0.org1 peer0.org2 peer0.org3..."
chaincodeInvoke 0 1 0 2 0 3

# Query on chaincode on peer0.org2, check if the result is 90
echo "Querying chaincode on peer0.org3..."
chaincodeQuery 0 2 90

# Stop here if you dont want to test Raft CFT
echo "Stop before testing CFT. Requested by user."
exit 0

# Test crash fault tolerance
echo
echo "Test crash fault tolerance"
echo "Please Shutdown 2/5 orderers: except orderer.org1 & orderer.org3"
for i in {20..1}
do
   echo "${i}s"
   sleep 1
done

echo "Wait 10s for Raft to elect new leader"
sleep 10

echo "Invoke from peer0.org1.de"
chaincodeInvoke 0 1 0 2 0 3

# Query on chaincode on peer0.org3, check if the result is 80
echo "Querying chaincode on peer0.org3... Raft must work and result must be 80"
chaincodeQuery 0 3 80

echo "Please shutdown 3/5 orderers. Quorom (4) uncreachable"
for i in {10..1}
do
   echo "${i}s"
   sleep 1
done

echo "Wait 10s"
sleep 10

echo "Invoke from peer0.org1.de in case raft lost consensus"
chaincodeInvokeInCrashCase 0 1 0 2 0 3

echo
echo "========= All GOOD, test completed successfully =========== "
echo

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo

exit 0
