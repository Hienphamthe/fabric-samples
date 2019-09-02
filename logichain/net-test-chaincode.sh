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
-C $CHANNEL_NAME -n devicedatacc --peerAddresses peer0.org1.de:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/peer0.org1.de/tls/ca.crt \
--peerAddresses peer0.org2.de:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt \
--peerAddresses peer0.org3.de:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt \
-c '{"function":"setDeviceData","Args":["1","contractOf12"]}'

# Transient field
export CHANNEL_NAME=logichainchannel
export PRIVATE=$(echo -n "{\"txid\":\"a51988931bb577da5d6895e48c9cadcda2b5933c6d079a05279c743715d60fd9\",\"payload\":{\"id\":1,\"damaged\":false,\"location\":[\"48.191656\",\"11.571069\"]},\"signature\":\"30171450c20bcc20a6e48062f0fa65b45e2e604c13e8fe9d7fcd278495750a67bfaec5a40eb8ba2b96d625691c4fa9b5b76cb8f1f28f704c43b4d1c5fc49b61877297e4cdbf504771fb8c4bc7bcef13ff1cc1ef3f6483589c9b4c40b38861369efb5a4846377c537407b16ee7f0b91c168114741b5f50180e91877b25df1532939085a9718452e43b65101bd6e08683be11512e912476d64515c3f6f871aabd24a82e98d93452a17b72932e15a35bd4d23507d1c7c72be21262e4689d7fc5ac40e9d79d0ae965e7bcce78bf351147bdbf44fe053ada890c46e28382f7856c49d3ec59a96d7a20db9bc7e4576a6b1d83ae45b0e840355fa4ff30a20b96c00938c\"}" | base64 | tr -d \\n)
--transient "{\"devicedata\":\"$PRIVATE\"}"

#Invoke chaincode (peer0.org1)
peer chaincode invoke -o orderer.org1.de:7050 --tls true --cafile \
/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/orderer.org1.de/msp/tlscacerts/tlsca.org1.de-cert.pem \
-C $CHANNEL_NAME -n devicedatacc \
--peerAddresses peer0.org1.de:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.de/peers/peer0.org1.de/tls/ca.crt \
--peerAddresses peer0.org2.de:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.de/peers/peer0.org2.de/tls/ca.crt \
--peerAddresses peer0.org3.de:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.de/peers/peer0.org3.de/tls/ca.crt \
-c '{"function":"setDeviceData","Args":["1","contractOf12"]}'

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