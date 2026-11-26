import { Card } from '../../components/ui/Card'
import { PageContainer } from '../../components/layout/PageContainer'
import { PageHeading } from '../../components/layout/PageHeading'
import { ProfileDetails } from './ProfileDetails'

export function ProfilePage() {
  return (
    <PageContainer className="max-w-4xl py-8 sm:py-12">
      <PageHeading
        title="Your profile"
        description="Describe your experience and the work you are interested in. Your details remain private unless you choose otherwise."
      />
      <Card className="p-5 shadow-card sm:p-8">
        <ProfileDetails />
      </Card>
    </PageContainer>
  )
}
