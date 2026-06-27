/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { type Table } from '@tanstack/react-table'
import { DollarSign } from 'lucide-react'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { batchAdjustUserQuota } from '../api'
import { type User, type QuotaAdjustMode } from '../types'
import { BatchQuotaDialog } from './batch-quota-dialog'

interface DataTableBulkActionsProps {
  table: Table<User>
  onSuccess: () => void
}

export function DataTableBulkActions({
  table,
  onSuccess,
}: DataTableBulkActionsProps) {
  const { t } = useTranslation()
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false)

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = selectedRows.map((row) => row.original.id)

  const handleBatchQuotaConfirm = async (
    mode: QuotaAdjustMode,
    value: number
  ) => {
    try {
      const result = await batchAdjustUserQuota({
        ids: selectedIds,
        mode,
        value,
      })
      if (result.success) {
        toast.success(
          t('Batch quota adjusted successfully', {
            count: result.data?.success_count ?? selectedIds.length,
          })
        )
        table.toggleAllRowsSelected(false)
        onSuccess()
      } else {
        toast.error(result.message || t('Failed to adjust quota'))
      }
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : t('Failed to adjust quota')
      )
    }
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='user'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setQuotaDialogOpen(true)}
        >
          <DollarSign className='mr-1 size-4' />
          {t('Adjust Quota')}
        </Button>
      </BulkActionsToolbar>

      <BatchQuotaDialog
        open={quotaDialogOpen}
        onOpenChange={setQuotaDialogOpen}
        selectedCount={selectedIds.length}
        onSuccess={handleBatchQuotaConfirm}
      />
    </>
  )
}
