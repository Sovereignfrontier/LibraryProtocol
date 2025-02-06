'use client';

import React, { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Box,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { ToastContainer, toast } from 'react-toastify';

import { Home } from 'lucide-react';

import FallbackBookCover from '@/components/library/FallbackBookCover';

import BookRequestsCard from '@/components/library/BookRequestsCard';

import BookSearchGrid from '@/components/library/BookSaerchCard';

import BookBorrowRequestsCard from '@/components/library/BookBorrowRequestsCard';



interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: Date;
  pagination: number;
  additionalNotes?: string;
  isbn: number;
  availability: boolean;
  image?: string;
  curatorId: string;
  createdAt: Date;
}

interface BookRequest {
  id: string;
  title: string;
  author: string;
  additionalNotes?: string;
  wallet: string;
  curatorId: string;
  createdAt: Date;
}

interface BorrowBookRequests {
  id: string;
  title: string;
  author: string;
  additionalNotes?: string;
  wallet: string;
  curatorId: string;
  createdAt: Date;
  name: string; // Add this
  email: string; // Add this
  deliveryAddress: string; // Add this
  borrowDate: Date; // Add this
  returnDate: Date; // Add this
  book: Book; // Add this
}

interface Curator {
  id: string;
  name: string;
  description?: string;
  country: string;
  state: string;
  city: string;
  publicNotice: string;
  coverImage?: string;
  isVerified: boolean;
  books: Book[];
  bookRequests: BookRequest[];
}

interface LandingDetailsProps {
  Curator: Curator;
}

// TODO: Improve modal logics later and mover interfaces to types.ts

const CuratorDashboard: React.FC<LandingDetailsProps> = ({ Curator }) => {
  const [open, setOpen] = useState(false);
  const [openPublicNotice, setOpenPublicNotice] = useState(false);
  const [publicNoticeText, setPublicNoticeText] = useState(Curator.publicNotice || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookRequests, setBookRequests] = useState<BookRequest[]>([]);
  const [bookBorrowRequests, setBookBorrowRequests] = useState<BorrowBookRequests[]>([]);
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [pagination, setPagination] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [Books, setBooks] = useState<Book[]>(Curator.books);
  const router = useRouter();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

    // Return home function
    const handleReturnHome = () => {
      router.push('/');
    };

  const handleSearchClick = () => {
    // Implement your search logic here
    console.log('Searching for:', searchQuery);
  };

  const handleImageError = (isbn: number) => {
    setFailedLoads((prev) => new Set(prev).add(isbn));
  };

  const handleClickOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setError(null); // Clear error state
    setIsbn(''); // Reset ISBN field
    setBookTitle('');
    setAuthor('');
    setAdditionalNotes('');
    setPublisher('');
    setPublishDate('');
    setPagination('');
    setCoverImage(null);
  };

  const handleClickOpenPublicNotice = () => setOpenPublicNotice(true);

  const handleClosePublicNotice = () => {
    setOpenPublicNotice(false);
    setPublicNoticeText(Curator.publicNotice || '');
  };

  const [failedLoads, setFailedLoads] = useState(new Set());


  useEffect(() => {
    if (isbn.length === 13) {
      fetchBookData(Number(isbn));
    }
  }, [isbn]);

  const fetchCoverImage = async (isbn: number) => {
    try {
      const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
      const coverResponse = await fetch(coverUrl);

      if (coverResponse.ok) {
        setCoverImage(coverUrl);
      } else {
        setCoverImage(null);
      }
    } catch (error) {
      console.error('Error fetching cover image:', error);
      setCoverImage(null);
    }
  };

  const fetchBookData = async (isbn: number) => {
    setSearchLoading(true);

    try {
      const response = await fetch(`/api/openlibrary/search?isbn=${isbn}`);

      // if (!response.ok) {
      //   throw new Error('Failed to fetch book data');
      // }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setBookTitle(data.title || '');
      setAuthor(data.authors || '');
      setPublisher(data.publisher || '');
      setPublishDate(data.publishDate || '');
      setPagination(data.pagination || '');

      await fetchCoverImage(isbn);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch book data', {
        position: 'bottom-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSavePublicNotice = async () => {

    if (publicNoticeText.length > 200) {
      toast.error('Public notice cannot exceed 200 characters.');

      return;
    }

    try {
      const response = await fetch('/api/library/curator/public-notice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicNotice: publicNoticeText, curatorId: Curator.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update public notice');
      }

      // Update the local state to reflect the new public notice
      Curator.publicNotice = publicNoticeText;  // Update the frontend state directly

      toast.success('Public notice updated successfully!');
      handleClosePublicNotice();
    } catch (error) {
      toast.error('Failed to update public notice');
    }
  };

  // const handleSubmitRequest = async () => {
  //   if (!bookTitle) {
  //     setError('Book title is required');

  //     return;
  //   }

  //   setError(null);
  //   setLoading(true);

  //   const requestData = {
  //     title: bookTitle,
  //     author: author || '',
  //     additionalNotes: additionalNotes || '',
  //     isbn: isbn || '',
  //     publisher: publisher || '',
  //     publishDate: publishDate || '',
  //     pagination: pagination || '',
  //     curatorId: Curator.id.toString(),
  //   };

  //   console.log('requested data', requestData);

  //   try {
  //     const response = await fetch(`/api/library/curator/${Curator.id}/add-book`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(requestData),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();

  //       throw new Error(errorData.error || 'Failed to submit request');
  //     }

  //     await response.json();

  //     toast.success('Your book has successfully been added to your catalog!', {
  //       position: 'bottom-center',
  //       autoClose: 3000,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: true,
  //       draggable: true,
  //     });

  //     setBookTitle('');
  //     setAuthor('');
  //     setAdditionalNotes('');
  //     setIsbn('');
  //     setPublisher('');
  //     setPublishDate('');
  //     setPagination('');
  //     setCoverImage(null);
  //     handleClose();

  //     window.location.reload();
  //   } catch (error: any) {
  //     toast.error(error.message || 'There was an error submitting your request', {
  //       position: 'bottom-center',
  //       autoClose: 3000,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: true,
  //       draggable: true,
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmitRequest = async () => {

    if (!bookTitle) {
      setError('Book title is required');

      return;
    }

    setError(null);
    setLoading(true);

    const requestData = {
      title: bookTitle,
      author: author || '',
      additionalNotes: additionalNotes || '',
      isbn: isbn || '',
      publisher: publisher || '',
      publishDate: publishDate || '',
      pagination: pagination || '',
      curatorId: Curator.id.toString(),
    };

    try {
      // Make the request to add the book
      const response = await fetch(`/api/library/curator/${Curator.id}/add-book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || 'Failed to submit request');
      }

      // Fetch the updated list of books after adding the new book
      const updatedBooksResponse = await fetch(`/api/library/curator/${Curator.id}`);

      if (!updatedBooksResponse.ok) {
        throw new Error('Failed to fetch updated books');
      }

      // Extract the books from the response
      const updatedBooks = await updatedBooksResponse.json();
      const books = updatedBooks.books; // Access the 'books' field

      // Update the state with the new list of books
      setBooks(books);

      toast.success('Your book has successfully been added to your catalog!', {
        position: 'bottom-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Reset form fields
      setBookTitle('');
      setAuthor('');
      setAdditionalNotes('');
      setIsbn('');
      setPublisher('');
      setPublishDate('');
      setPagination('');
      setCoverImage(null);
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'There was an error submitting your request', {
        position: 'bottom-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchBookRequests = async () => {
      try {
        const response = await fetch(`/api/library/curator/${Curator.id}/book-requests`);

        // if (!response.ok) {
        //   throw new Error(`Failed to fetch: ${response.statusText}`);
        // }

        const data = await response.json();

        // Only update state if bookRequests exists in response
        if (data.bookRequests) {
          setBookRequests(data.bookRequests || []); // Fallback to empty array if `bookRequests` is missing
        }

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (Curator.id) {
      fetchBookRequests();
    }
  }, [Curator.id]);

  useEffect(() => {
    const fetchBookBorrowRequests = async () => {
      try {
        const response = await fetch(`/api/library/curator/${Curator.id}/book-borrow-requests`);

        // if (!response.ok) {

        //   throw new Error(`Failed to fetch: ${response.statusText}`);
        // }

        const data = await response.json();

        if (data.borrowings) {
          setBookBorrowRequests(data.borrowings || []);
        }

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (Curator.id) {
      fetchBookBorrowRequests();
    }
  }, [Curator.id]);

  const ipfsUrl = process.env.NEXT_PUBLIC_IPFS_GATEWAY;

  return (
    <div className="relative max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8">
       <Box
        sx={{
          position: 'absolute',
          top: 12,
          left: -50,
          zIndex: 10
        }}
      >
        <Button
          variant="contained" // Ensures a solid background
          onClick={handleReturnHome}
          sx={{
            minWidth: 'auto',
            p: 1,
            backgroundColor: 'black', // Black background
            color: 'white', // White text
            borderColor: 'black',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.8)', // Slightly lighter black on hover
              borderColor: 'black'
            }
          }}
        >
          <Home size={32} />
        </Button>
      </Box>
      <ToastContainer />

      <Grid container spacing={3}>
        {/* Left Side: Image and Library Notice Card */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card elevation={3} sx={{ height: '550px' }}>
                <Box sx={{ position: 'relative', height: '100%' }}>
                <img
                  src={`${ipfsUrl}${Curator.coverImage}`}
                  alt={Curator.name}
                  className="w-full h-[550px] object-cover" />
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent sx={{ p: 4 }}>
                <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row', // Horizontally align the title and the button
                      alignItems: 'center', // Vertically center the items
                      justifyContent: 'center', // Center the content horizontally
                      width: '100%',
                      height: '80px',
                      gap: 2, // Add spacing between the title and the button
                    }}
                  >
                    <Typography variant="h5">{Curator.name} Library Notice</Typography>

                    {/* Conditional button for updating public notice */}
                    {Curator.publicNotice && Curator.publicNotice.trim() && (
                      <Button
                      variant="outlined"
                      onClick={handleClickOpenPublicNotice} // Open the modal to update the public notice
                      sx={{
                        fontSize: '0.8rem',
                        padding: '4px 8px',
                        textTransform: 'none',
                        height: '30px',
                        width: 'auto',
                        backgroundColor: 'black',
                        borderColor: 'black',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#f5f5f5', // Slight gray on hover
                          borderColor: 'black',
                        },
                      }}
                    >
                      Update
                    </Button>
                    )}
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      height: '100px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      px: 3,
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      {Curator.publicNotice ? (
                        Curator.publicNotice
                      ) : (
                        <Button
                        variant="outlined"
                        onClick={handleClickOpenPublicNotice} // Open the modal
                        sx={{
                          mt: 2,
                          backgroundColor: "black",
                          color: "white",
                          borderColor: "white",
                          "&:hover": {
                            backgroundColor: "white",
                            color: "black",
                            borderColor: "black",
                          },
                        }}
                      >
                        Add a Public Notice
                      </Button>
                      )}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Side: Welcome, Current Lendings, and Current Book Requests */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <div
                className="relative bg-gradient-to-r from-green-600 to-teal-500 rounded-[5px] overflow-hidden p-4 text-white transform transition-all duration-300 hover:scale-10 hover:shadow-2xl"
                style={{ minHeight: 'auto' }}
              >
                <div className="absolute inset-0 bg-black/10 hover:bg-black/20 transition-all duration-300 z-0" />
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Welcome, {Curator.name}</h2>
                <p className="text-sm sm:text-base mb-3">
                  Contribute to our onchain library. Share your favorite books and help others discover new stories.
                </p>
                <div className="flex justify-end">
                  <button
                    className="bg-white text-black px-5 py-1.5 rounded-lg font-medium text-base hover:bg-black hover:text-white transition-colors z-20 relative"
                    onClick={handleClickOpen}
                  >
                    Add a Book
                  </button>
                </div>
              </div>
            </Grid>
            <Grid item xs={12}>
              <BookBorrowRequestsCard bookBorrowRequests={bookBorrowRequests} Curator={Curator} />
            </Grid>
            <Grid item xs={12}>
              <BookRequestsCard bookRequests={bookRequests} Curator={Curator} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Card elevation={3} sx={{ mt: 4 }}>
      <BookSearchGrid
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchClick={handleSearchClick}
        BookCurator={Curator}
        Books={Books}
        failedLoads={failedLoads as Set<number>}
        onImageError={handleImageError}
      />
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add A Book</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', gap: 4 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="ISBN"
                variant="outlined"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                error={!!error}
                helperText={error}
                InputProps={{
                  endAdornment: searchLoading ? (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : null,
                }}
              />
              <TextField
                fullWidth
                label="Book Title"
                variant="outlined"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
              />
              <TextField
                fullWidth
                label="Author"
                variant="outlined"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
              <TextField
                fullWidth
                label="Publisher"
                variant="outlined"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
              />
              <TextField
                fullWidth
                label="Publish Date"
                variant="outlined"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
              />
              <TextField
                fullWidth
                label="Pagination"
                variant="outlined"
                value={pagination}
                onChange={(e) => setPagination(e.target.value)}
              />
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={3}
                variant="outlined"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </Box>

            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={publisher}
                  style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: '3px' }}
                />
              ) : (
                <FallbackBookCover title={bookTitle} author={author} />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            sx={{
              color: 'black',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
          variant="contained"
          onClick={handleSubmitRequest}
          disabled={loading}
          sx={{
            color: 'white',
            backgroundColor: 'black',
            border: '1px solid white',
            display: 'flex', // Flexbox to align content
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1, // Adds spacing when showing text
            minWidth: 120, // Prevents width shrink on loading
            '&:hover': {
              backgroundColor: 'white',
              color: 'black',
            },
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Add Book'}
        </Button>
        </DialogActions>
      </Dialog>

      {/* Modal for Adding/Editing Public Notice */}
      <Dialog
          open={openPublicNotice}
          onClose={handleClosePublicNotice}
          maxWidth="sm" // Adjust maxWidth as needed
          fullWidth
          sx={{
            '& .MuiDialogPaper-root': {
              width: '80%',  // Adjust width if necessary
              maxWidth: 'sm',  // Ensure maxWidth is applied
              margin: 'auto',  // Center the dialog horizontally
              top: '50%',  // Center vertically
              transform: 'translateY(-50%)',  // Adjust for perfect centering
            }
          }}
        >
          <DialogTitle>Add/Edit Public Notice</DialogTitle>
          <DialogContent>
          <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Enter your public notice here..."
              value={publicNoticeText}
              onChange={(e) => setPublicNoticeText(e.target.value)}
              sx={{ mt: 2 }}
              inputProps={{
                maxLength: 200, // Limit the number of characters to 150
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePublicNotice}>Cancel</Button>
            <Button
              onClick={handleSavePublicNotice}
              variant="contained"
              color="primary"
              disabled={!publicNoticeText.trim()} // Disable if text is empty
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
    </div>
  );
};

export default CuratorDashboard;
