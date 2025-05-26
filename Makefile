.PHONY: test _build build build-docker compress-wasm schema start-server store-contract-local clean

OPTIMISED_WASM_DIR := ./contract/optimized-wasm

test:
	cargo unit-test

# This does not work on Apple Silicon Macs, use build-docker instead
build:
	cd contract; RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown
	mkdir -p $(OPTIMISED_WASM_DIR)
	wasm-opt -Oz ./contract/target/wasm32-unknown-unknown/release/*.wasm -o $(OPTIMISED_WASM_DIR)/contract.wasm
	cd $(OPTIMISED_WASM_DIR); gzip -n -9 -f *

build-docker:
	cd contract; docker run --rm -v "$$(pwd)":/contract \
		--mount type=volume,source="$$(basename "$$(pwd)")_cache",target=/code/target \
		--mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
		mr7uca/wasm-contract-optimizer:0.0.12

schema:
	cd contract; cargo run --example schema

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
	cargo clean
	-rm -f $(OPTIMISED_WASM_DIR)

