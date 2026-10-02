# OEQL Cloud RAN / 5G Lab Fabric

This directory defines the deployable control-plane foundation for an OEQL private/test 4G/5G network.

## Architecture

UE/eSIM -> LTE eNB or 5G gNB -> Open5GS 4G/5G core -> UPF -> authorized IP transit

The cloud layer supplies:
- subscriber/profile orchestration
- network-function health
- capacity accounting
- slice/QoS policy metadata
- telemetry
- deployment configuration
- provider/RAN attachment status

It does not create licensed RF spectrum or a radio transmitter by software alone.

## Current upstream basis

Open5GS provides 4G/5G EPC and 5G SA core network functions including NRF, SCP, AMF, SMF, UPF, AUSF, UDM, UDR, PCF, NSSF and BSF. The current Open5GS documentation describes connecting an external eNB/gNB over S1/NG and testing with real or simulated UEs.

For a lawful private/test deployment, use an authorized test/private PLMN or an issued operator PLMN. Do not transmit on public cellular spectrum without the required authorization.

## Capacity model

Set capacity from measured hardware rather than inventing a number:
- RAN cells/sites: hardware-dependent
- active UEs: core/RAN sizing dependent
- aggregate throughput: RF bandwidth, MIMO, spectrum, transport and compute dependent
- UPF throughput: NIC/CPU/DPDK configuration dependent
- subscribers: database/storage dependent

## Production prerequisites

1. Dedicated cloud/edge/VM infrastructure capable of SCTP/GTP-U networking.
2. Open5GS 5G SA core.
3. Authorized gNB/eNB or SDR/RAN.
4. Test/private PLMN or operator-issued PLMN.
5. Subscriber credentials/eSIM provisioning system.
6. IP transit/backhaul.
7. Monitoring and security controls.
8. RF compliance and spectrum authorization where applicable.

Render remains the public OEQL application/control plane; the RAN/core data plane should run on dedicated networking infrastructure rather than the current Render web service.

## Verification

Do not mark a cell ACTIVE until:
- gNB/eNB attaches to AMF/MME;
- UE registration succeeds;
- PDU session establishes;
- UPF forwards traffic;
- throughput and latency are measured;
- logs and metrics are healthy.

## References

- Open5GS documentation: https://open5gs.org/open5gs/docs/
- Open5GS quickstart: https://open5gs.org/open5gs/docs/guide/01-quickstart/
