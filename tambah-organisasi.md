# URUTAN LANGKAH BERASAL DARI HYPERLEDGER FABRIC DOC 
## Melakukan update pada configurasi channel
Update yang dilakukan adalah update untuk mendaftarkan crypto config dan consesnsus baru yang mencakup policy untuk organisasi baru yang ditambahkan
1. Update config channel tx
2. Generate crypto organisasi baru
```
../fabric-samples/bin/cryptogen generate --config=./crypto-config-newOrg.yaml
```
3. Convert konfigurasi tx menjadi artifact dalam format json
```
export FABRIC_CFG_PATH=$PWD && ../../bin/configtxgen -printOrg Org3MSP > ../channel-artifacts/org3.json
```
4. Export environtment value root cert orderer dan nama channel yang akan diupdate dalam container cli (fabric-tools)
```
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem  && export CHANNEL_NAME=mychannel

echo $ORDERER_CA && echo $CHANNEL_NAME
```
5. Fetch channel config block dari ledger
```
peer channel fetch config config_block.pb -o orderer.example.com:7050 -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
```
6. Convert proto buff block yang sudah didownload menjadi format json
```
configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config > config.json
```
7. Masukan data crypto material dari Org3 ke dalam config.json dengan output di file baru
```
jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"Org3MSP":.[1]}}}}}' config.json ./channel-artifacts/org3.json > modified_config.json
```
8. Ubah file config.json dan modified_config.json menjadi format protobuff block kembali dalam file yang berbeda
```
configtxlator proto_encode --input config.json --type common.Config --output config.pb
configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb
```
9. Compare delta antara config.json (config channel lama) dengan modified_config.json (config channel baru)
```
configtxlator compute_update --channel_id $CHANNEL_NAME --original config.pb --updated modified_config.pb --output org3_update.pb
```
	Command ini akan menghasilkan file org3_update.pb dimana file ini meruakan protobuff block yang berisi configurasi channel yang sudah ditambahkan crypto materia Org3 di dalamnya.

10. Decode file org3_update.pb dalam format json agar dapat ditambahkan header sebelum dikirimkan ke ledger network
```
configtxlator proto_decode --input org3_update.pb --type common.ConfigUpdate | jq . > org3_update.json

``` 
11. Tambahkan header update ke file org3_update.json
```
echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL_NAME'", "type":2}},"data":{"config_update":'$(cat org3_update.json)'}}}' | jq . > org3_update_in_envelope.json
```
	Command tersebut akan menghasilkan file json baru org3_update_in_envelope.json 
12. Encode file org3_update_in_envelope.json menjadi block protobuff
```
configtxlator proto_encode --input org3_update_in_envelope.json --type common.Envelope --output org3_update_in_envelope.pb
```
13. Lakukan update signing terhadap konfigurasi baru yang sudah tersedia pada file org3_update_in_envelope.pb
```
peer channel signconfigtx -f org3_update_in_envelope.pb
```
	Update signing dilakukan pada semua anchor peer setiap organisasi dengan MSP admin
14. Upload file block protobuff config channel yang baru ke network (bisa dilakukan dengan MSP organisasi manapun yang memiliki akses admin ke network)
```
peer channel update -f org3_update_in_envelope.pb -c $CHANNEL_NAME -o orderer.example.com:7050 --tls --cafile $ORDERER_CA
```

## Joining new organization to the ledger network
1. Jalankan server peer
```
docker-compose -f docker-compose-org3.yaml up -d
```
2. Export konfigurasi untuk orderer root ca dan channel name pada containr Org3Cli
```
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem && export CHANNEL_NAME=mychannel
```
3. Download genesis block dari channel "mychannel" dimana channel tersebut adalah channel tempat Org3 ingin bergabung
```
peer channel fetch 0 mychannel.block -o orderer.example.com:7050 -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
```
4. Join peer ke ledger network
```
peer channel join -b mychannel.block
```
	Dengan demikian peer sudah tergabung ke channel "mychannel". Apa bila terdapat lebih dari satu peer lakukan langkah yang sama pada peer yang lain
5. Apabila dalm network sudah dilakukan instantiate chaincode, lakukan lagi pada organisasi yang baru saja bergabung
```
peer chaincode install -n mycc -v 2.0 -p github.com/chaincode/chaincode_example02/go/
```
	Di atas adalah contoh command instantiate chaincode dari dokumentasi official
6. Setelah chaincode terakhir terinstall di semua anchor peer di setiap organisasi update chaincode pada ledger network
```
peer chaincode upgrade -o orderer.example.com:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n mycc -v 2.0 -c '{"Args":["init","a","90","b","210"]}' -P "OR ('Org1MSP.peer','Org2MSP.peer','Org3MSP.peer')"

```

## Update achor peer Org3

1. Ambli block config terbaru ke server yang menjalankan cli fabric-tools untuk Org3
```
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem && export CHANNEL_NAME=mychannel
peer channel fetch config config_block.pb -o orderer.example.com:7050 -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
```
2. Decode config_block.pb ke dalam format json dengan configxlator
```
configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config > config.json
```
3. Update konfigurasi json, masukkan konfigurasi anchor peer Org3
```
jq '.channel_group.groups.Application.groups.Org3MSP.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "peer0.org3.example.com","port": 11051}]},"version": "0"}}' config.json > modified_anchor_config.json
```
4. Lakukan langkah yang sama seperti update konfigurasi untuk mendaftarkan Org3 ke network
```
configtxlator proto_encode --input config.json --type common.Config --output config.pb
configtxlator proto_encode --input modified_anchor_config.json --type common.Config --output modified_anchor_config.pb
configtxlator compute_update --channel_id $CHANNEL_NAME --original config.pb --updated modified_anchor_config.pb --output anchor_update.pb
configtxlator proto_decode --input anchor_update.pb --type common.ConfigUpdate | jq . > anchor_update.json
echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL_NAME'", "type":2}},"data":{"config_update":'$(cat anchor_update.json)'}}}' | jq . > anchor_update_in_envelope.json
configtxlator proto_encode --input anchor_update_in_envelope.json --type common.Envelope --output anchor_update_in_envelope.pb

peer channel update -f anchor_update_in_envelope.pb -c $CHANNEL_NAME -o orderer.example.com:7050 --tls --cafile $ORDERER_CA

```