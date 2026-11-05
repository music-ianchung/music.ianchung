# Winter garden and After Hours

Starlight: the first 36 table seat indices are unchanged. Seats 36–47 form an inward-facing circle around the Christmas tree. The existing 12 tree seats use the same walker, occupancy and radio controls. The nearby-seat button on the ritual dock filters for free tree seats. Manual floor movement and stargazing remain available.

After Hours (`?hall=jazzbar`): 20 seats around five tables plus 10 raised bar stools. A low stage holds an animated quintet with piano, double bass, drums, saxophone and trumpet. Both seat types support click-to-walk and nearby-seat controls. The main entrance now offers four destinations and uses an actual scene screenshot for the jazz bar card. Both Korean and English are supported.

Jazz bar has four user-supplied recordings (199.6, 193.56, 149.76 and 238.8 seconds), shown as numbers without titles. The shared clock and four-item recommendation flow match the other performance halls. After the fourth piece, the playlist loops to the first; the eight-second interlude includes quiet applause. Personal file/link playback remains available. No chamber recording or synthetic piano playlist plays here.

The presence server has an independent jazzbar room, 30 seats/capacity, and a four-recording shared music clock; greenhouse has 48 seats/capacity. Existing rooms and recording URLs are preserved. D1 schema is unchanged. Backend source commit: d763cd11548d57c6db0bba6e0223289fafd60555.

Validation: syntax checks; all 12 new tree seats and all 30 jazz bar seats have a clear route from the entrance; backend tests cover last-seat bounds, exclusive occupancy and room isolation; browser checks cover bar-to-table seating, tree-circle seating, English UI and live Jazz Groove playback.
