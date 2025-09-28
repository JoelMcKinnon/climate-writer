<template>
  <div class="min-h-screen bg-ccl-sand50">
    <Head>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap" rel="stylesheet">
    </Head>

    <header class="bg-white border-b">
      <div class="mx-auto max-w-5xl px-6 py-8 text-center">
        <h1 class="text-5xl font-extrabold text-ccl-blue">Climate Writer</h1>
        <p class="mt-2 text-2xl text-ccl-green">It’s your climate, too. Jump in.</p>
        <p class="mt-3 text-slate-600">
          A CCL-style coach to help you craft strong letters to the editor—fast and respectful.
        </p>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-6 py-8">
      <NuxtPage />
    </main>
  </div>
</template>
