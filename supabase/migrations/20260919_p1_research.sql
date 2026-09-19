-- P1: require research key on report payloads (nullable object allowed).

alter table reports drop constraint if exists reports_reserved_keys;

alter table reports add constraint reports_reserved_keys check (
  payload ? 'monetization'
  and payload ? 'pmf'
  and payload ? 'experiments'
  and payload ? 'canvas'
  and payload ? 'pestle'
  and payload ? 'pitch'
  and payload ? 'research'
);
