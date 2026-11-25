drop policy if exists "evidence_storage_owner_insert"
on storage.objects;

create policy "evidence_storage_insert_only_through_validator"
on storage.objects as restrictive
for insert
to authenticated
with check (bucket_id <> 'evidence');

drop policy if exists "evidence_storage_owner_update"
on storage.objects;

create policy "evidence_storage_update_only_outside_evidence_bucket"
on storage.objects as restrictive
for update
to authenticated
using (bucket_id <> 'evidence')
with check (bucket_id <> 'evidence');
