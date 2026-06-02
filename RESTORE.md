# Restore Original Design (Before Redesign v3)

If you want to undo the UI redesign and go back to the previous look:

## Option A — Full folder restore (safest)

1. Delete or rename the current `society-app` folder.
2. Copy the backup folder back:
   - **Backup location:** `d:\Project\SRI KUBER APARTMENT\society-app-backup-2026-06-02_0932`
3. Rename the copy to `society-app`.

## Option B — Git branch restore

```powershell
cd "d:\Project\SRI KUBER APARTMENT\society-app"
git checkout backup/pre-redesign-2026-06-02
```

To return to the redesigned version later:

```powershell
git checkout main
```

## Option C — Remove only redesign layer (partial)

Delete these files and revert `main.jsx`:

- `src/redesign-v3.css`
- `src/components/ui/` (entire folder)
- Remove `import './redesign-v3.css'` from `src/main.jsx`

Then restore page files from the backup folder or git branch.

---

**Backup created:** 2 June 2026  
**Redesign branch:** `main` (local changes)  
**Safety branch:** `backup/pre-redesign-2026-06-02`
