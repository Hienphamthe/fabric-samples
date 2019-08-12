#!/bin/bash
#Manual

#Install chaincode in peer0.org1
#peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/chaincode_example02/go/

#Install chaincode in peer0.org2
#CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/users/Admin@org2.de/msp CORE_PEER_ADDRESS=peer0.org2.de:9051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/chaincode_example02/go/

#Install chaincode in peer0.org3
#CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/users/Admin@org3.de/msp CORE_PEER_ADDRESS=peer0.org3.de:11051 CORE_PEER_LOCALMSPID="Org3MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/chaincode_example02/go/

#Instantiate chaincode from peer0.org1
#peer chaincode instantiate -o orderer.org1.de:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/orderer.org1.de/msp/tlscacerts/tlsca.org1.de-cert.pem -C $CHANNEL_NAME -n mycc -v 1.0 -c '{"Args":["init","a", "100", "b","200"]}' -P "AND ('Org1MSP.peer','Org2MSP.peer','Org3MSP.peer')"

#Query chaincode from peer0.org2
#CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/users/Admin@org2.de/msp CORE_PEER_ADDRESS=peer0.org2.de:9051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt peer chaincode query -C $CHANNEL_NAME -n mycc -c '{"Args":["query","a"]}'

#Invoke chaincode from peer0.org3
#CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/users/Admin@org3.de/msp CORE_PEER_ADDRESS=peer0.org3.de:11051 CORE_PEER_LOCALMSPID="Org3MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt peer chaincode invoke -o orderer.org3.de:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/orderer.org3.de/msp/tlscacerts/tlsca.org3.de-cert.pem -C $CHANNEL_NAME -n mycc --peerAddresses peer0.org1.de:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/peer0.org1.de/tls/ca.crt --peerAddresses peer0.org2.de:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt --peerAddresses peer0.org3.de:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt -c '{"Args":["invoke","a","b","10"]}'

#Query chaincode from peer0.org1 to check value. Should be 90
#peer chaincode query -C $CHANNEL_NAME -n mycc -c '{"Args":["query","a"]}'


#peer0.org2 env var
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/users/Admin@org2.de/msp \
CORE_PEER_ADDRESS=peer0.org2.de:9051 CORE_PEER_LOCALMSPID="Org2MSP" \
CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt

#peer0.org3 env var
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/users/Admin@org3.de/msp \
CORE_PEER_ADDRESS=peer0.org3.de:11051 CORE_PEER_LOCALMSPID="Org3MSP" \
CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt

#install chaincode
peer chaincode install -n mycc -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/approval_cc/

#Instantiate chaincode (peer0.org1)
peer chaincode instantiate -o orderer.org1.de:7050 --tls \
--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/orderer.org1.de/msp/tlscacerts/tlsca.org1.de-cert.pem \
-C $CHANNEL_NAME -n mycc -v 1.0 -l node -c '{"function":"init","Args":[]}' -P "AND ('Org1MSP.peer','Org2MSP.peer','Org3MSP.peer')"

#Query chaincode
peer chaincode query -C $CHANNEL_NAME -n mycc -c '{"function":"getAllAppoval","Args":[]}'

#Invoke chaincode (peer0.org3)
peer chaincode invoke -o orderer.org3.de:7050 --tls true --cafile \
/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/orderer.org3.de/msp/tlscacerts/tlsca.org3.de-cert.pem \
-C $CHANNEL_NAME -n approvalcc --peerAddresses peer0.org1.de:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/peer0.org1.de/tls/ca.crt \
--peerAddresses peer0.org2.de:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt \
--peerAddresses peer0.org3.de:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt \
-c '{"function":"setOrgApproval","Args":["Org1","true","1,2"]}'

#Invoke chaincode (peer0.org1)
peer chaincode invoke -o orderer.org1.de:7050 --tls true --cafile \
/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/orderer.org1.de/msp/tlscacerts/tlsca.org1.de-cert.pem \
-C $CHANNEL_NAME -n devicekeycc --peerAddresses peer0.org1.de:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/peer0.org1.de/tls/ca.crt \
--peerAddresses peer0.org2.de:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt \
--peerAddresses peer0.org3.de:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt \
-c '{"function":"setDevice","Args":["1","new key"]}'

#Invoke chaincode (peer0.org2)
peer chaincode invoke -o orderer.org2.de:7050 --tls true --cafile \
/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/orderer.org2.de/msp/tlscacerts/tlsca.org2.de-cert.pem \
-C $CHANNEL_NAME -n mycc --peerAddresses peer0.org1.de:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/peer0.org1.de/tls/ca.crt \
--peerAddresses peer0.org2.de:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt \
--peerAddresses peer0.org3.de:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt \
-c '{"function":"setOrgApproval","Args":["Org2","true","a,b,c"]}'

#Upgrade chaincode
peer chaincode upgrade -n mycc -v 1.1 \
-c '{"Args":[]}' \
--tls \
--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/orderer.org1.de/msp/tlscacerts/tlsca.org1.de-cert.pem \
-p /opt/gopath/src/github.com/chaincode/approval_cc/ \
-C mychannel \
-l node \
-o orderer.org1.de:7050