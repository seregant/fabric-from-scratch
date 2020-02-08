1. Update config channel tx
2. Generate crypto organisasi baru
```
../fabric-samples/bin/cryptogen generate --config=./crypto-config-newOrg.yaml
```
3. Generate channeltx artifact baru
```
../fabric-samples/bin/configtxgen -profile FourOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/SupportOrgMSPanchors.tx -channelID $CHANNEL_NAME -asOrg SupportOrgMSP

```
4. Jalankan server peer baru
    Tambahkan pada docker-compose.yaml
    ```
    
    ```
5. Join peer organisasi ke channel
```
#support Org
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/support.workspace/users/Admin@support.workspace/msp
export CORE_PEER_ADDRESS=peer1.support.workspace:13051
export CORE_PEER_LOCALMSPID="SupportOrgMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/support.workspace/peers/peer1.support.workspace/tls/ca.crt
peer channel join -b ./workspace.block
peer channel update \
	-o orderer1.workspace:7050 \
	-c $CHANNEL_NAME \
	-f ./channel-artifacts/Org4MSPanchors.tx \
	--tls \
	--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/workspace/orderers/orderer1.workspace/msp/tlscacerts/tlsca.workspace-cert.pem
```