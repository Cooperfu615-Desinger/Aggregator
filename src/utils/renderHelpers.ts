import { h } from 'vue'
import { NIcon, NTooltip } from 'naive-ui'
import { useI18n } from 'vue-i18n'

// Simple info icon component
const InfoCircleIcon = () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 512 512',
    fill: 'currentColor'
}, [
    h('path', {
        d: 'M256 56C145.72 56 56 145.72 56 256s89.72 200 200 200 200-89.72 200-200S366.28 56 256 56zm0 82a26 26 0 11-26 26 26 26 0 0126-26zm48 226h-88a16 16 0 010-32h28v-68h-16a16 16 0 010-32h32a16 16 0 0116 16v84h28a16 16 0 010 32z'
    })
])

/**
 * Renders a table header with an info icon tooltip
 * @param label - The column header label text
 * @param tooltipKey - The i18n key for the tooltip content
 * @param align - Alignment of the header content ('left' | 'center' | 'right')
 * @returns VNode for the table header with tooltip
 */
export function renderHeaderWithTooltip(label: string, tooltipKey: string, align: 'left' | 'center' | 'right' = 'left') {
    const { t } = useI18n()

    const justifyMapping = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end'
    }

    return h(
        'div',
        {
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: justifyMapping[align]
            }
        },
        [
            h('span', label),
            h(
                NTooltip,
                { trigger: 'hover' },
                {
                    trigger: () => h(
                        NIcon,
                        {
                            size: 14,
                            style: { cursor: 'pointer', opacity: 0.6, marginLeft: '4px' }
                        },
                        { default: InfoCircleIcon }
                    ),
                    default: () => h('span', t(tooltipKey))
                }
            )
        ]
    )
}
