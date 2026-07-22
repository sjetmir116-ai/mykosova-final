  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      // Vendos lokacionin rezervë (Prishtinë) nëse browseri nuk e mbështet
      setUserLocation({ lat: 42.6629, lng: 21.1655 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        setGpsError(error.message);
        // LOKACIONI REZERVË: Nëse përdoruesi e refuzon GPS-in ose ndodh timeout,
        // kodi vendos automatikisht koordinatat e Kosovës që harta të mos mbetet bosh.
        setUserLocation({ lat: 42.6629, lng: 21.1655 });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);
