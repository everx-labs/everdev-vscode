# Release Notes

All the notable changes to the "TONDEV" VS Code extension will be documented in this file.

## [0.5.0] 2021-04-30
### New

- TONDEV 0.5 commands support. 
**Attention!** The current UI is preliminary and not even experimental, and will be changed in future. 
Skip entering the default values in UI by clicking Enter. 

This release is an intermediate step between current tondev functionality and future VS Code GUI implementation.
In the next releases we plan to add nice UI for contract deployment and execution, network management, signer management.
### Fixed

- tvm_linker downloads always even if it's up to date.

## [0.3.3] 2021-03-20

### New

- Support for TONDEV 0.3.3
- Command categories looks like "tondev-sol", "tondev-se" etc.

### Fixed

- Parameters that can be an empty string was not accepted.
- Folder selection was fallen when there was no context folder (now it uses the first workspace folder).
- Folder selection was fallen when focus was on non file (e.g. output or terminal).

## [0.1.0] 2021-02-02

### New

- Solidity functionality added:
  - Create a hello world contract in one click
  - Install compiler in the background upon the first request
  - Compile and link a contract in one click
  - Get solidity compiler version
  - Download the latest compiler
- SDK functionality added:
  - Create a Node.js project with the latest SDK dependencies and index.js script with main client object creation
