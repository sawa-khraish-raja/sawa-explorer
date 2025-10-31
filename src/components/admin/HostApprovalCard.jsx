import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Star,
  MessageSquare,
  Eye,
  UserCheck,
  UserX,
  Loader2,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Eye
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle
  },
  needs_info: {
    label: 'Needs Info',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircle
  }
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' }
};

export default function HostApprovalCard({ request, onApprove, onReject, onUpdate }) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [approvalData, setApprovalData] = useState({
    host_type: 'freelancer',
    office_id: request.office_id || '',
    assigned_cities: [request.host_city],
    admin_notes: ''
  });

  const [rejectionData, setRejectionData] = useState({
    rejection_reason: 'incomplete_info',
    rejection_details: ''
  });

  const status = statusConfig[request.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const priority = priorityConfig[request.priority || 'normal'];

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(request, approvalData);
      setShowApproveDialog(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(request, rejectionData);
      setShowRejectDialog(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateVerificationScore = () => {
    let score = 0;
    if (request.host_bio) score += 15;
    if (request.experience_years > 0) score += 20;
    if (request.languages?.length > 1) score += 15;
    if (request.services_offered?.length > 2) score += 15;
    if (request.id_document_url) score += 25;
    if (request.profile_photo_url) score += 10;
    return Math.min(score, 100);
  };

  const verificationScore = request.verification_score || calculateVerificationScore();

  return (
    <>
      <Card className={cn(
        "hover:shadow-lg transition-all border-2",
        request.priority === 'urgent' && "border-red-300",
        request.priority === 'high' && "border-orange-300"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {request.profile_photo_url ? (
                <img
                  src={request.profile_photo_url}
                  alt={request.host_full_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-gray-900 truncate">
                  {request.host_full_name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge className={cn("border", status.color)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                  <Badge className={priority.color}>
                    {priority.label}
                  </Badge>
                  {request.request_type === 'office_added' && (
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                      Office Request
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold">{verificationScore}%</span>
              </div>
              <span className="text-xs text-gray-500">
                {format(new Date(request.created_date), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{request.host_email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{request.host_phone}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{request.host_city}</span>
            </div>
            {request.experience_years > 0 && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{request.experience_years} years exp</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {request.host_bio && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 line-clamp-2">{request.host_bio}</p>
            </div>
          )}

          {/* Languages & Services */}
          <div className="flex flex-wrap gap-2">
            {request.languages?.map(lang => (
              <Badge key={lang} variant="outline" className="text-xs">
                🌐 {lang}
              </Badge>
            ))}
            {request.services_offered?.slice(0, 3).map(service => (
              <Badge key={service} variant="outline" className="text-xs bg-purple-50">
                {service}
              </Badge>
            ))}
            {request.services_offered?.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{request.services_offered.length - 3} more
              </Badge>
            )}
          </div>

          {/* Documents */}
          {(request.id_document_url || request.profile_photo_url) && (
            <div className="flex gap-2">
              {request.id_document_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={request.id_document_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4 mr-2" />
                    ID Document
                  </a>
                </Button>
              )}
              {request.profile_photo_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={request.profile_photo_url} target="_blank" rel="noopener noreferrer">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Photo
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Actions */}
          {request.status === 'pending' || request.status === 'under_review' ? (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setShowDetailsDialog(true)}
                variant="outline"
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Review
              </Button>
              <Button
                onClick={() => setShowApproveDialog(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                variant="destructive"
                className="flex-1"
              >
                <UserX className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowDetailsDialog(true)}
              variant="outline"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          )}

          {/* Admin Notes Preview */}
          {request.admin_notes && (
            <div className="pt-2 border-t">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 line-clamp-2">{request.admin_notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Host Request</DialogTitle>
            <DialogDescription>
              Configure host settings before approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Host Type</Label>
              <Select
                value={approvalData.host_type}
                onValueChange={(value) => setApprovalData({...approvalData, host_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freelancer">Freelance Host (35% commission)</SelectItem>
                  <SelectItem value="office">Office Host (28% + 7% office)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {approvalData.host_type === 'office' && (
              <div>
                <Label>Office ID</Label>
                <Input
                  value={approvalData.office_id}
                  onChange={(e) => setApprovalData({...approvalData, office_id: e.target.value})}
                  placeholder="Enter office ID"
                />
              </div>
            )}

            <div>
              <Label>Admin Notes (Optional)</Label>
              <Textarea
                value={approvalData.admin_notes}
                onChange={(e) => setApprovalData({...approvalData, admin_notes: e.target.value})}
                placeholder="Internal notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Host
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Host Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Rejection Reason</Label>
              <Select
                value={rejectionData.rejection_reason}
                onValueChange={(value) => setRejectionData({...rejectionData, rejection_reason: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete_info">Incomplete Information</SelectItem>
                  <SelectItem value="fake_documents">Fake/Invalid Documents</SelectItem>
                  <SelectItem value="insufficient_experience">Insufficient Experience</SelectItem>
                  <SelectItem value="poor_language_skills">Poor Language Skills</SelectItem>
                  <SelectItem value="duplicate_account">Duplicate Account</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Details (Will be sent to applicant)</Label>
              <Textarea
                value={rejectionData.rejection_details}
                onChange={(e) => setRejectionData({...rejectionData, rejection_details: e.target.value})}
                placeholder="Explain why this request was rejected..."
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing || !rejectionData.rejection_details}
              variant="destructive"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Host Request Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Full info display */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Full Name</Label>
                <p className="font-semibold">{request.host_full_name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <p className="font-semibold">{request.host_email}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Phone</Label>
                <p className="font-semibold">{request.host_phone}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">City</Label>
                <p className="font-semibold">{request.host_city}</p>
              </div>
              {request.experience_years > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Experience</Label>
                  <p className="font-semibold">{request.experience_years} years</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Request Type</Label>
                <p className="font-semibold capitalize">{request.request_type.replace('_', ' ')}</p>
              </div>
            </div>

            {request.host_bio && (
              <div>
                <Label className="text-xs text-gray-500">Bio</Label>
                <p className="text-sm mt-1">{request.host_bio}</p>
              </div>
            )}

            {request.languages?.length > 0 && (
              <div>
                <Label className="text-xs text-gray-500">Languages</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {request.languages.map(lang => (
                    <Badge key={lang} variant="outline">{lang}</Badge>
                  ))}
                </div>
              </div>
            )}

            {request.services_offered?.length > 0 && (
              <div>
                <Label className="text-xs text-gray-500">Services Offered</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {request.services_offered.map(service => (
                    <Badge key={service} variant="outline" className="bg-purple-50">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {request.admin_notes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-xs text-gray-500">Admin Notes</Label>
                <p className="text-sm mt-1">{request.admin_notes}</p>
              </div>
            )}

            {request.status === 'rejected' && request.rejection_details && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <Label className="text-xs text-red-700">Rejection Reason</Label>
                <p className="text-sm mt-1 text-red-900">{request.rejection_details}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}