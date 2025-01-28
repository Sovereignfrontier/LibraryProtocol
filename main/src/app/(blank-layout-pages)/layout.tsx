// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'
import PrivyProviderWrapper from '@/components/wallet/PrivyProviderWrapper'

type Props = ChildrenType

const Layout = async (props: Props) => {
  const { children } = props

  // Vars
  const direction = 'ltr'
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction}>
      <BlankLayout systemMode={systemMode}>
        <PrivyProviderWrapper>
         {children}
        </PrivyProviderWrapper>
      </BlankLayout>
    </Providers>
  )
}

export default Layout
