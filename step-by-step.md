1. Install prerequisities dari link https://hyperledger-fabric.readthedocs.io/en/release-1.4/install.html
2. Mencoba BYFN dari hyperledger fabric docs
3. Cek tool untuk setup tersedia dalam bentuk binary pada folder fabric-samples/bin
4. Setup crypto config
```
    fabric-samples/bin/cryptogen generate --config=./crypto-config.yaml
```
5. Set env FABRIC_CFG_PATH
```
    export FABRIC_CFG_PATH=$PWD
```
6. Buat genesis block
```
    ../fabric-samples/bin/configtxgen -profile Raft -channelID workspace-sys-channel -outputBlock ./channel-artifacts/genesis.block
```
7. Buat channel transaction config artifact
```
    export CHANNEL_NAME=workspace
    ../fabric-samples/bin/configtxgen -profile FourOrgsChannel -outputCreateChannelTx ./channel-artifacts/workspace.tx -channelID $CHANNEL_NAME
```
8. Buat anchor peer config artifact
```
    ../fabric-samples/bin/configtxgen -profile FourOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
    ../fabric-samples/bin/configtxgen -profile FourOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org2MSP
    ../fabric-samples/bin/configtxgen -profile FourOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org3MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org3MSP
    ../fabric-samples/bin/configtxgen -profile FourOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org4MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org4MSP
```
9. Setting FABRIC_CA_SERVER_TLS_KEYFILE (apabila ingin menggunakan CA server)
    
    Ganti environtment value FABRIC_CA_SERVER_TLS_KEYFILE pada dockerfile di bagian service sesuai dengan nama file dengan namafile yang diakhiri dengan karakter _sk dalam folder crypto-config/peerOrganizations/<nama organisasi>/ca/ 
    Contoh :
```
    crypto-config/peerOrganizations/developers.workspace/ca/7b78cdeba1a69d0386af379abf83a55e3a7dddbfa0d609305964b76a5eb1ce08_sk
```

10. Jalankan network

```
    export COMPOSE_PROJECT_NAME=net
    export IMAGE_TAG=latest
    export SYS_CHANNEL=workspace-sys-channel  

    docker-compose up -d
```

11. Masuk ke container fabric-tools cli

```
    export CHANNEL_NAME=workspace
```

12. Buat channel baru

```
    #export variables untuk konfigurasi fabric-tools agar dapat berkomunikasi dengan network (path sudah disesuaikan pada docker-compose.yaml)
    
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/developers.workspace/users/Admin@developers.workspace/msp
    export CORE_PEER_ADDRESS=peer1.developers.workspace:7051
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/developers.workspace/peers/peer1.developers.workspace/tls/ca.crt

    #Buat channel baru
    
    peer channel create \
    -o orderer1.workspace:7050 \
    -c $CHANNEL_NAME \
    -f ./channel-artifacts/$CHANNEL_NAME.tx \
    --outputBlock ./$CHANNEL_NAME.block \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/workspace/orderers/orderer1.workspace/msp/tlscacerts/tlsca.workspace-cert.pem
```

13. Join peer ke channel dan update anchor peer ke orderer

```
    # export variables untuk konfigurasi fabric-tools untuk memuat konfigurasi organisasi yang mana
    
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/developers.workspace/users/Admin@developers.workspace/msp
    export CORE_PEER_ADDRESS=peer1.developers.workspace:7051
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/developers.workspace/peers/peer1.developers.workspace/tls/ca.crt

    # Join peer dari organisasi ke network
    peer channel join -b ./workspace.block
    
    # Update anchor peer
    peer channel update \
	-o orderer1.workspace:7050 \
	-c $CHANNEL_NAME \
	-f ./channel-artifacts/Org1MSPanchors.tx \
	--tls \
	--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/workspace/orderers/orderer1.workspace/msp/tlscacerts/tlsca.workspace-cert.pem
```