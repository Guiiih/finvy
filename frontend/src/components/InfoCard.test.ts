import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InfoCard from './InfoCard.vue'

describe('InfoCard.vue', () => {
  it('renderiza o título e o valor formatado corretamente', () => {
    const wrapper = mount(InfoCard, {
      props: {
        title: 'Saldo Atual',
        value: 1234.56,
        currency: 'R$',
      },
    })

    expect(wrapper.find('.card-title').text()).toBe('Saldo Atual')
    expect(wrapper.find('.card-value').text()).toBe('R$ 1234.56')
  })

  it('aplica a classe "positive-value" quando isPositive é true', () => {
    const wrapper = mount(InfoCard, {
      props: {
        title: 'Lucro',
        value: 500,
        isPositive: true,
      },
    })

    expect(wrapper.find('.card-value').classes()).toContain('positive-value')
  })

  it('aplica a classe "negative-value" quando isPositive é false', () => {
    const wrapper = mount(InfoCard, {
      props: {
        title: 'Prejuízo',
        value: -250,
        isPositive: false,
      },
    })

    expect(wrapper.find('.card-value').classes()).toContain('negative-value')
  })

  it('aplica a classe "neutral-value" quando isPositive não é fornecido e o valor é zero', () => {
    const wrapper = mount(InfoCard, {
      props: {
        title: 'Balanço',
        value: 0,
        isPositive: undefined,
      },
    })

    expect(wrapper.find('.card-value').classes()).toContain('neutral-value')
  })

  it('formata corretamente valores negativos', () => {
    const wrapper = mount(InfoCard, {
      props: {
        title: 'Dívida',
        value: -987.1,
        currency: '$',
      },
    })

    expect(wrapper.find('.card-value').text()).toBe('-$ 987.10')
  })
})
