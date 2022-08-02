# Cosmos tendermint rpc enable server
  
rpc endpoint로 tendermint binary를 해독하는 client를 연결하여 response를 제공합니다.

## set up
  
  ```
    yarn install
    yarn start
  ```
  
yarn start하면 server port: 9000에 오픈됩니다.

## tips
  
- /txs_event/:events 
 - tx에서 raw_log에서 볼 수 있는 events array의 항목들을 검색할 수 있는 쿼리
 - example) /txs_event/message.sender='osmovaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4ep88n0y4'&message.action='edit_validator' > 
