<template>
  <div class="min-h-screen bg-white">
    <!-- Hero -->
    <section class="py-20 px-4 sm:px-6 bg-gradient-to-b from-amber-50 to-white">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight" style="font-family: 'Bricolage Grotesque', sans-serif">Delete Your Kinora Account</h1>
        <p class="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">Request the deletion of your Kinora account and associated personal data. You can delete your account directly from the Kinora mobile app or contact Kinora Support if you cannot access your account.</p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#in-app" class="px-6 py-3 bg-amber-500 text-white rounded-full font-semibold text-sm hover:bg-amber-600 transition shadow-md">Delete Account</a>
          <a :href="mailtoLink" class="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-medium text-sm hover:border-amber-300 transition">Contact Support</a>
        </div>
      </div>
    </section>

    <main class="py-12 px-4 sm:px-6">
      <div class="max-w-4xl mx-auto space-y-10">
        <!-- In-app deletion -->
        <section id="in-app" class="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 class="text-2xl font-bold text-gray-900 mb-3">In-app Account Deletion</h2>
          <p class="text-sm text-gray-600 mb-4">You can delete your account directly from the Kinora mobile app. Follow these steps:</p>
          <ol class="list-decimal list-inside text-sm text-gray-600 space-y-2">
            <li>Open the Kinora app.</li>
            <li>Sign in to your account.</li>
            <li>Open <strong>Settings</strong>.</li>
            <li>Open <strong>Account</strong>.</li>
            <li>Select <strong>Delete Account</strong>.</li>
            <li>Review the deletion information.</li>
            <li>Confirm the account deletion request.</li>
            <li>Complete any required verification.</li>
            <li>Your account deletion request will be processed.</li>
          </ol>
          <p class="mt-4 text-xs text-gray-500">Important: Account deletion requests are processed by our backend and may not be immediate.</p>
        </section>

        <!-- Can't access? -->
        <section class="bg-gray-50 rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 class="text-2xl font-bold text-gray-900 mb-3">Can't Access Your Account?</h2>
          <p class="text-sm text-gray-600 mb-4">If you cannot access your Kinora account, you can request account deletion by contacting Kinora Support. Please do not include passwords, OTPs, or payment card numbers.</p>
          <div class="bg-white border border-gray-100 rounded-lg p-4">
            <p class="text-sm text-gray-700">Email:</p>
            <p class="text-sm font-medium text-amber-700"><a :href="mailtoLink">support@kinorafamilies.com</a></p>
            <p class="mt-3 text-sm text-gray-600">Please provide:</p>
            <ul class="list-disc list-inside text-sm text-gray-600">
              <li>The email address associated with your Kinora account</li>
              <li>Your full name, if available</li>
              <li>A brief request to delete your Kinora account</li>
            </ul>

            <div class="mt-4 text-sm">
              <p class="font-medium">Example</p>
              <pre class="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700">Subject: Kinora Account Deletion Request

Message:
I would like to request deletion of my Kinora account.

Account email: [your-email@example.com]
Full name: [Your full name]</pre>
            </div>
          </div>
        </section>

        <!-- What happens to data -->
        <section class="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 class="text-2xl font-bold text-gray-900 mb-3">What Happens to Your Data?</h2>
          <p class="text-sm text-gray-600 mb-4">When an account deletion request is completed, Kinora will delete personal and account-related data associated with the account, subject to applicable legal, security, and operational requirements. The following categories are removed where supported by our backend:</p>
          <ul class="list-disc list-inside text-sm text-gray-600 space-y-2">
            <li>Account information</li>
            <li>Profile information</li>
            <li>Family membership information</li>
            <li>Child account information associated with the account</li>
            <li>Location data associated with the account</li>
            <li>Safe Zone and location history data</li>
            <li>Family-related data associated with the account</li>
            <li>User-generated content associated with the account, where applicable</li>
            <li>Other personal information associated with the account</li>
          </ul>
          <p class="mt-4 text-xs text-gray-500">Note: Only data types supported by the backend deletion process will be removed. If you need clarification about a specific data type, contact support.</p>
        </section>

        <!-- Data retention -->
        <section class="bg-gray-50 rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 class="text-2xl font-bold text-gray-900 mb-3">Data Retention</h2>
          <p class="text-sm text-gray-600">Kinora processes account deletion requests within 30 days. Certain encrypted backups may be retained temporarily according to Kinora's backup retention procedures and will be deleted according to the applicable retention period. Certain information may be retained when required by applicable law, for fraud prevention, security, dispute resolution, or other legitimate legal purposes.</p>
        </section>

        <!-- Partial deletion -->
        <section class="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 class="text-2xl font-bold text-gray-900 mb-3">Partial Data Deletion</h2>
          <p class="text-sm text-gray-600">Some data may be managed or removed without deleting the entire Kinora account where the applicable feature is available. To request deletion of specific personal data without deleting your entire account, contact Kinora Support at <a :href="mailtoLink">support@kinorafamilies.com</a>. Your request will be reviewed according to applicable privacy requirements.</p>
        </section>

        <!-- Support -->
        <section class="bg-gray-50 rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 class="text-2xl font-bold text-gray-900 mb-3">Need Help?</h2>
          <p class="text-sm text-gray-600">For account deletion or privacy-related requests, contact:</p>
          <p class="mt-2 text-sm font-medium text-amber-700"><a :href="mailtoLink">support@kinorafamilies.com</a></p>
          <p class="mt-4 text-xs text-gray-500">Do not provide passwords, OTPs, authentication tokens, or payment information via email.</p>
        </section>

        <!-- Links -->
        <section class="py-4 text-sm text-gray-600">
          <div class="flex gap-4">
            <a href="/privacy" class="text-amber-700 font-medium">Privacy Policy</a>
            <a v-if="hasTerms" href="/terms" class="text-amber-700 font-medium">Terms of Service</a>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

const supportEmail = 'support@kinorafamilies.com'
const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent('Kinora Account Deletion Request')}&body=${encodeURIComponent('I would like to request deletion of my Kinora account.%0D%0A%0D%0AAccount email:%20%5Byour-email%40example.com%5D%0D%0AFull name:%20%5BYour%20full%20name%5D')}`

const hasTerms = true

onMounted(() => {
  document.title = 'Delete Your Kinora Account | Kinora'

  // Meta description
  let md = document.querySelector('meta[name="description"]')
  if (!md) {
    md = document.createElement('meta')
    md.setAttribute('name', 'description')
    document.head.appendChild(md)
  }
  md.setAttribute('content', 'Request deletion of your Kinora account and associated personal data. Learn how to delete your account through the Kinora app or contact Kinora Support.')

  // Canonical
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', 'https://kinorafamilies.com/delete-account')

  // Robots
  let robots = document.querySelector('meta[name="robots"]')
  if (!robots) {
    robots = document.createElement('meta')
    robots.setAttribute('name', 'robots')
    document.head.appendChild(robots)
  }
  robots.setAttribute('content', 'index, follow')
})

export default {
}
</script>

<style scoped>
pre { white-space: pre-wrap; }
</style>
