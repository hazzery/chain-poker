.PHONY: init start-server store-contract-local clean

OPTIMISED_WASM_DIR := ./contract/optimized-wasm
OPTIMISED_WASM_FILE := $(OPTIMISED_WASM_DIR)/chain_poker.wasm.gz
UPLOAD_DATA_FILE := ./node/output/upload.json
INSTANTIATE_DATA_FILE := ./node/output/instantiation.json

$(INSTANTIATE_DATA_FILE): $(UPLOAD_DATA_FILE)
	cd node; npx tsx instantiate.ts
	cp "$(shell ls -1 ./node/output/instantiation-*.json | tail -n 1)" $(INSTANTIATE_DATA_FILE)

$(UPLOAD_DATA_FILE): $(OPTIMISED_WASM_FILE)
	cd node && npx tsx upload.ts && npx tsx writeEnv.ts
	cp $$(ls -1 ./node/output/upload-*.json | tail -n 1) $(UPLOAD_DATA_FILE)

$(OPTIMISED_WASM_FILE): $(wildcard ./contract/src/*.rs) $(wildcard ./contract/src/*/*.rs)
	cd contract; sudo docker run --rm -v "$$(pwd)":/contract \
	--mount type=volume,source="$$(basename "$$(pwd)")_cache",target=/code/target \
	--mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
	ghcr.io/scrtlabs/secret-contract-optimizer:1.0.13
	cd contract && cargo run --bin schema

# Initialised npm environments
init:
	cd secretts && npm i && npx tsc
	cd frontend && npm i

# Run local development chain with four funded accounts (named a, b, c, and d)
start-server: # CTRL+C to stop
	sudo docker run -it --rm \
		-p 9091:9091 -p 26657:26657 -p 26656:26656 -p 1317:1317 -p 5000:5000 \
		-v $$(pwd):/root/code \
		--name secretdev ghcr.io/scrtlabs/localsecret:v1.6.0-rc.3

# This relies on running `start-server` in another console
# You can run other commands on the secretcli inside the dev image
# by using `docker exec secretdev secretcli`.
store-contract-local:
	sudo docker exec secretdev secretcli tx compute store -y --from a --gas 100000000 /root/code/contract.wasm.gz

clean:
	cd contract; cargo clean
	-rm -rf $(OPTIMISED_WASM_DIR)

