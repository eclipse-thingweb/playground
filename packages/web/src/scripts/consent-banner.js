const analyticsAcceptBtn = document.getElementById("accept-analytics-btn")
const analyticsDeclineBtn = document.getElementById("decline-analytics-btn")
const analyticsBanner = document.getElementById("analytics-banner")
const manageAnalyticsLink = document.getElementById("consent-link")

// Show banner if the user has not set any preference
if(localStorage.getItem('consentMode') === null){
    analyticsBanner.classList.remove("hidden")
}

// Open analytics banner when clicking on the cookie manager link
manageAnalyticsLink.addEventListener("click", () => {
    analyticsBanner.classList.remove("hidden")
})

//If analytics are rejected, close the banner and update the new user preference
analyticsDeclineBtn.addEventListener("click", () => {
    analyticsBanner.classList.add("hidden")

    const consentPreferences = {
        'ad_storage': 'denied',
        'analytics_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'personalization_storage': 'denied',
        'functionality_storage': 'denied',
        'security_storage': 'denied',
    }

    updateConsentMode(consentPreferences)
})

//If analytics are accepted, close the banner and update the new user preference
analyticsAcceptBtn.addEventListener("click", () => {
    analyticsBanner.classList.add("hidden")

    const consentPreferences = {
        'ad_storage': 'denied',
        'analytics_storage': 'granted',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'personalization_storage': 'denied',
        'functionality_storage': 'denied',
        'security_storage': 'denied',
    }

    updateConsentMode(consentPreferences)
})

/**
 * Update the user preferences to grant or decline google analytics tracking
 * @param { Object } preferences 
 */
function updateConsentMode(preferences) {
    gtag('consent', 'update', preferences)
    localStorage.setItem('consentMode', JSON.stringify(preferences))
}