#!/bin/bash
#Manual

#Create mychannel.block
#docker exec cli sh -c 'export CHANNEL_NAME=mychannel'
docker exec cli sh -c 'peer channel create -o orderer.org1.de:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/orderer.org1.de/msp/tlscacerts/tlsca.org1.de-cert.pem'

#peer0.org1 join mychannel
docker exec cli sh -c 'peer channel join -b mychannel.block'

#peer0.org2 join mychannel
docker exec cli sh -c 'CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/users/Admin@org2.de/msp CORE_PEER_ADDRESS=peer0.org2.de:9051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt peer channel join -b mychannel.block'

#peer0.org3 join mychannel
docker exec cli sh -c 'CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/users/Admin@org3.de/msp CORE_PEER_ADDRESS=peer0.org3.de:11051 CORE_PEER_LOCALMSPID="Org3MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt peer channel join -b mychannel.block'

#peer1.org1 join mychannel
docker exec cli sh -c 'CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/users/Admin@org1.de/msp CORE_PEER_ADDRESS=peer1.org1.de:8051 CORE_PEER_LOCALMSPID="Org1MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/peer0.org1.de/tls/ca.crt peer channel join -b mychannel.block'

#peer1.org2 join mychannel
docker exec cli sh -c 'CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/users/Admin@org2.de/msp CORE_PEER_ADDRESS=peer1.org2.de:10051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt peer channel join -b mychannel.block'

#peer1.org3 join mychannel
docker exec cli sh -c 'CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/users/Admin@org3.de/msp CORE_PEER_ADDRESS=peer1.org3.de:12051 CORE_PEER_LOCALMSPID="Org3MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt peer channel join -b mychannel.block'

#update anchor peer0.org1
docker exec cli sh -c 'peer channel update -o orderer.org1.de:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org1MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/orderer.org1.de/msp/tlscacerts/tlsca.org1.de-cert.pem'

#update anchor peer0.org2
docker exec cli sh -c 'CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/users/Admin@org2.de/msp CORE_PEER_ADDRESS=peer0.org2.de:9051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt peer channel update -o orderer.org2.de:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org2MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/orderer.org2.de/msp/tlscacerts/tlsca.org2.de-cert.pem'

#update anchor peer0.org3
docker exec cli sh -c 'CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/users/Admin@org3.de/msp CORE_PEER_ADDRESS=peer0.org3.de:11051 CORE_PEER_LOCALMSPID="Org3MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt peer channel update -o orderer.org3.de:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org3MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/orderer.org3.de/msp/tlscacerts/tlsca.org3.de-cert.pem'

