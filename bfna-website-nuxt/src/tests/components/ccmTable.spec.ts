import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ccmTable from '../../components/ds/organisms/ccmTable.vue'

describe('ccmTable', () => {
  it('renders caption, column headers, and rows from data', async () => {
    const wrapper = await mountSuspended(ccmTable, {
      props: {
        caption: 'Test Table',
        data: {
          headers: ['H1', 'H2', 'H3'],
          rows: [
            ['R1C1', 'R1C2', 'R1C3'],
            ['R2C1', 'R2C2', 'R2C3']
          ]
        }
      }
    })

    const caption = wrapper.find('caption')
    expect(caption.exists()).toBe(true)
    expect(caption.text()).toBe('Test Table')

    const headers = wrapper.findAll('thead th')
    expect(headers.length).toBe(3)
    headers.forEach(h => expect(h.attributes('scope')).toBe('col'))

    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(2)
    expect(rows[0].findAll('td').length).toBe(3)
  })

  it('supports rowHeaders making first column <th scope="row">', async () => {
    const wrapper = await mountSuspended(ccmTable, {
      props: {
        rowHeaders: true,
        data: {
          headers: ['H1', 'H2'],
          rows: [
            ['Row A', 'A2'],
            ['Row B', 'B2']
          ]
        }
      }
    })

    const firstRowCells = rowsOf(wrapper)[0]
    expect(firstRowCells[0].element.tagName.toLowerCase()).toBe('th')
    expect(firstRowCells[0].attributes('scope')).toBe('row')
    expect(firstRowCells[1].element.tagName.toLowerCase()).toBe('td')
  })

  it('applies variant attribute and CSS variables for theming', async () => {
    const wrapper = await mountSuspended(ccmTable, {
      props: {
        variant: 'primary',
        backgroundColor: 'brand',
        borderColor: 'color-base',
        data: { headers: ['H1'], rows: [['C1']] }
      }
    })

    const table = wrapper.find('table')
    expect(table.attributes('variant')).toBe('primary')

    const style = table.attributes('style') || ''
    expect(style.includes('--_ccm-table-thead-bg: var(--color-brand-100)')).toBe(true)
    expect(style.includes('--_ccm-table-tbody-bg: var(--color-brand-05-tint)')).toBe(true)
  })
})

function rowsOf(wrapper: any) {
  return wrapper.findAll('tbody tr').map((tr: any) => tr.findAll('th,td'))
}


